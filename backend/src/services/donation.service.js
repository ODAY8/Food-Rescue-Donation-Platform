const DonationModel = require("../models/donation.model");
const FoodModel     = require("../models/food.model");
const notifService  = require("./notification.service");
const emailService  = require("./email.service");
const prisma        = require("../config/prisma");

// Allowed transitions: { currentStatus: { newStatus: allowedRole } }
const TRANSITIONS = {
    PENDING:           { APPROVED: "donor", REJECTED: "donor", PICKUP_SCHEDULED: "donor", CANCELLED: "both" },
    APPROVED:          { PICKUP_SCHEDULED: "donor", CANCELLED: "both" },
    PICKUP_SCHEDULED:  { COLLECTED: "ngo", CANCELLED: "both" },
    COLLECTED:         { DELIVERED: "ngo" },
    DELIVERED:         { COMPLETED: "donor" },
};

const TIMESTAMP_FIELDS = {
    APPROVED:         "approvedAt",
    REJECTED:         "rejectedAt",
    PICKUP_SCHEDULED: "pickupScheduledAt",
    COLLECTED:        "collectedAt",
    DELIVERED:        "deliveredAt",
    COMPLETED:        "completedAt",
};

const NOTIFICATIONS = {
    APPROVED:         { donor: null, ngo: { title: "Claim approved!", msg: "Your claim has been approved. Please arrange pickup.", type: "success" } },
    REJECTED:         { donor: null, ngo: { title: "Claim rejected", msg: "The donor declined your claim.", type: "warning" } },
    PICKUP_SCHEDULED: { donor: null, ngo: { title: "Pickup scheduled", msg: "The donor has scheduled a pickup for your claim.", type: "info" } },
    COLLECTED:        { donor: { title: "Food collected", msg: "The NGO has collected your donation.", type: "success" }, ngo: null },
    DELIVERED:        { donor: null, ngo: null },
    COMPLETED:        { donor: null, ngo: { title: "Donation completed!", msg: "Your pickup has been marked as completed.", type: "success" } },
    CANCELLED:        { donor: null, ngo: { title: "Donation cancelled", msg: "The donation has been cancelled.", type: "warning" } },
};

const claimFood = async (foodId, userId) => {
    const food = await FoodModel.findById(foodId);
    if (!food)                       throw new Error("Food listing not found");
    if (food.status !== "AVAILABLE") throw new Error("This food is no longer available");
    if (food.donorId === userId)     throw new Error("You cannot claim your own donation");
    if (food.expiryDate < new Date()) throw new Error("This food has already expired");

    const [donation] = await prisma.$transaction([
        prisma.donation.create({
            data: { foodId, ngoId: userId, donorId: food.donorId },
            include: {
                food: { select: { id: true, title: true, pickupLocation: true, pickupWindow: true } },
                donor: { select: { id: true, name: true, email: true, organization: true } },
                ngo: { select: { id: true, name: true, organization: true } },
            },
        }),
        prisma.food.update({ where: { id: foodId }, data: { status: "CLAIMED" } }),
    ]);

    notifService.push(
        food.donorId,
        "Your donation was claimed!",
        `"${food.title}" has been claimed and is awaiting your approval.`,
        "success",
        `/listing/${foodId}`
    );

    if (donation.donor?.email) {
        emailService.sendClaimNotification({
            donorEmail: donation.donor.email,
            donorName: donation.donor.name,
            foodTitle: food.title,
            ngoName: donation.ngo?.organization || donation.ngo?.name,
        }).catch((err) => console.error("Failed to send claim email:", err.message));
    }

    return { success: true, data: donation };
};

const getMyDonations = async (userId) => {
    const donations = await DonationModel.findByDonorId(userId);
    return { success: true, data: donations };
};

const getMyClaimedFoods = async (userId) => {
    const claims = await DonationModel.findByNgoId(userId);
    return { success: true, data: claims };
};

const getDonationById = async (id, userId, userRole) => {
    const donation = await DonationModel.findById(id);
    if (!donation) throw new Error("Donation not found");

    // Only the donor, the NGO, or an admin may view a donation
    const isDonor = donation.donorId === userId;
    const isNgo   = donation.ngoId   === userId;
    if (!isDonor && !isNgo && userRole !== "ADMIN") {
        throw new Error("Not authorized to view this donation");
    }

    return { success: true, data: donation };
};

// Admin-only: list all donations with pagination + status filter
const listAllDonations = async (query = {}) => {
    const result = await DonationModel.findAll(query);
    return { success: true, data: result.data, pagination: result.pagination };
};

const updateDonationStatus = async (id, newStatus, userId) => {
    const donation = await DonationModel.findById(id);
    if (!donation) throw new Error("Donation not found");

    const allowed = TRANSITIONS[donation.status];
    if (!allowed || !allowed[newStatus]) {
        throw new Error(`Cannot transition from ${donation.status} to ${newStatus}`);
    }

    const requiredRole = allowed[newStatus];
    const isDonor = donation.donorId === userId;
    const isNgo   = donation.ngoId   === userId;

    if (requiredRole === "donor" && !isDonor) throw new Error("Only the donor can perform this action");
    if (requiredRole === "ngo"   && !isNgo)   throw new Error("Only the NGO can perform this action");
    if (requiredRole === "both"  && !isDonor && !isNgo) throw new Error("Not authorized");

    const timestamps = TIMESTAMP_FIELDS[newStatus] ? { [TIMESTAMP_FIELDS[newStatus]]: new Date() } : {};

    // If cancelling an approved/pending donation, restore food to AVAILABLE
    const extraOps = (newStatus === "CANCELLED")
        ? [prisma.food.update({ where: { id: donation.foodId }, data: { status: "AVAILABLE" } })]
        : [];

    const [updated] = await prisma.$transaction([
        prisma.donation.update({
            where: { id },
            data: { status: newStatus, ...timestamps },
            include: {
                food: { select: { id: true, title: true, pickupLocation: true, pickupWindow: true } },
                ngo: { select: { id: true, name: true, email: true } },
                donor: { select: { id: true, name: true, organization: true } },
            },
        }),
        ...extraOps,
    ]);

    const notifs = NOTIFICATIONS[newStatus];
    if (notifs?.ngo) notifService.push(donation.ngoId, notifs.ngo.title, notifs.ngo.msg, notifs.ngo.type);
    if (notifs?.donor) notifService.push(donation.donorId, notifs.donor.title, notifs.donor.msg, notifs.donor.type);

    if (newStatus === "APPROVED" && updated.ngo?.email) {
        emailService.sendApprovalNotification({
            ngoEmail: updated.ngo.email,
            ngoName: updated.ngo.name,
            foodTitle: updated.food?.title,
            donorName: updated.donor?.organization || updated.donor?.name,
            pickupLocation: updated.food?.pickupLocation,
            pickupWindow: updated.food?.pickupWindow,
        }).catch((err) => console.error("Failed to send approval email:", err.message));
    }

    return { success: true, data: updated };
};

module.exports = { claimFood, getMyDonations, getMyClaimedFoods, getDonationById, listAllDonations, updateDonationStatus };
