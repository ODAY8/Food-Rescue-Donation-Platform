const prisma = require("../config/prisma");
const donationService = require("./donation.service");
const notifService = require("./notification.service");
const emailService = require("./email.service");
const FoodModel = require("../models/food.model");

const REMINDER_INTERVAL_MS = parseInt(process.env.SCHEDULE_REMINDER_INTERVAL_MS, 10) || 15 * 60 * 1000; // 15 min default
const REMINDER_HOURS = parseInt(process.env.SCHEDULE_REMINDER_HOURS, 10) || 2;

const create = async (donorId, body) => {
    const { foodId, scheduledFor, notes } = body;
    const scheduled = new Date(scheduledFor);
    if (Number.isNaN(scheduled.getTime())) throw new Error("Invalid scheduled date");
    if (scheduled < new Date()) throw new Error("Scheduled pickup must be in the future");

    let food = null;
    if (foodId) {
        food = await FoodModel.findById(foodId);
        if (!food) throw new Error("Food listing not found");
        if (food.donorId !== donorId) throw new Error("Not authorized to schedule this food");
    } else {
        // Create a food listing from the schedule request.
        food = await FoodModel.create(
            {
                title: body.title,
                description: body.description || "Scheduled donation.",
                category: body.category || "Other",
                quantity: parseInt(body.quantity) || 1,
                unit: body.unit || "kg",
                servings: parseInt(body.servings) || 0,
                expiryDate: body.expiryDate,
                pickupLocation: body.pickupLocation || "",
                pickupWindow: body.pickupWindow || "",
                city: body.city || "",
                latitude: body.latitude,
                longitude: body.longitude,
            },
            donorId
        );
    }

    // Prevent scheduling food that has already expired.
    if (new Date(food.expiryDate) < new Date()) throw new Error("Cannot schedule food that has already expired");

    const schedule = await prisma.scheduledDonation.create({
        data: { donorId, foodId: food.id, scheduledFor: scheduled, notes: notes || null },
    });

    return { success: true, data: { ...schedule, food } };
};

const listForDonor = async (donorId, query = {}) => {
    const { page = 1, limit = 20 } = query;
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const where = { donorId };
    const [data, total] = await Promise.all([
        prisma.scheduledDonation.findMany({
            where,
            include: { food: { select: { id: true, title: true, quantity: true, unit: true } }, ngo: { select: { id: true, name: true, organization: true } } },
            orderBy: { scheduledFor: "asc" },
            skip: (p - 1) * l,
            take: l,
        }),
        prisma.scheduledDonation.count({ where }),
    ]);
    return { success: true, data, pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) } };
};

const listForNgo = async (ngoId, query = {}) => {
    const { page = 1, limit = 20 } = query;
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const where = { status: "SCHEDULED" }; // open schedules; NGO user city matched below
    const [data, total] = await Promise.all([
        prisma.scheduledDonation.findMany({
            where,
            include: { food: { select: { id: true, title: true, quantity: true, unit: true, city: true } }, donor: { select: { id: true, name: true, organization: true } } },
            orderBy: { scheduledFor: "asc" },
            skip: (p - 1) * l,
            take: l,
        }),
        prisma.scheduledDonation.count({ where }),
    ]);
    return { success: true, data, pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) } };
};

const accept = async (scheduleId, ngoId) => {
    const schedule = await prisma.scheduledDonation.findUnique({
        where: { id: scheduleId },
        include: { food: true },
    });
    if (!schedule) throw new Error("Scheduled donation not found");
    if (schedule.status !== "SCHEDULED") throw new Error("This scheduled donation is no longer open");
    if (new Date(schedule.scheduledFor) < new Date()) throw new Error("This scheduled donation has passed");

    // Claim the linked food via the existing V1 donation flow (creates donation + CLAIMED food).
    const claimResult = await donationService.claimFood(schedule.foodId, ngoId);
    const donation = claimResult.data;

    // Transition the new donation to PICKUP_SCHEDULED at the scheduled time.
    const updated = await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "PICKUP_SCHEDULED", pickupScheduledAt: schedule.scheduledFor },
    });

    // Link schedule → donation + NGO.
    await prisma.scheduledDonation.update({
        where: { id: scheduleId },
        data: { donationId: donation.id, ngoId, status: "CLAIMED" },
    });

    return { success: true, data: { schedule: { ...schedule, status: "CLAIMED" }, donation: updated } };
};

const reschedule = async (scheduleId, donorId, newDate) => {
    const schedule = await prisma.scheduledDonation.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new Error("Scheduled donation not found");
    if (schedule.donorId !== donorId) throw new Error("Not authorized to reschedule this donation");
    if (schedule.status !== "SCHEDULED") throw new Error("Only open schedules can be rescheduled");

    const scheduled = new Date(newDate);
    if (Number.isNaN(scheduled.getTime())) throw new Error("Invalid scheduled date");
    if (scheduled < new Date()) throw new Error("Scheduled pickup must be in the future");

    const food = await FoodModel.findById(schedule.foodId);
    if (food && new Date(food.expiryDate) < scheduled) throw new Error("Scheduled pickup must be before the food expiry date");

    const updated = await prisma.scheduledDonation.update({
        where: { id: scheduleId },
        data: { scheduledFor: scheduled },
    });
    return { success: true, data: updated };
};

const cancel = async (scheduleId, donorId) => {
    const schedule = await prisma.scheduledDonation.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new Error("Scheduled donation not found");
    if (schedule.donorId !== donorId) throw new Error("Not authorized to cancel this donation");
    if (schedule.status !== "SCHEDULED") throw new Error("Only open schedules can be cancelled");

    const updated = await prisma.$transaction([
        prisma.scheduledDonation.update({ where: { id: scheduleId }, data: { status: "CANCELLED" } }),
        // If the linked food was never claimed, restore it to AVAILABLE.
        prisma.food.update({
            where: { id: schedule.foodId },
            data: { status: "AVAILABLE" },
        }),
    ]);
    return { success: true, data: updated[0] };
};

// Background job: push reminders for scheduled pickups within REMINDER_HOURS.
const sendReminders = async () => {
    const windowStart = new Date();
    const windowEnd = new Date(Date.now() + REMINDER_HOURS * 60 * 60 * 1000);
    const due = await prisma.scheduledDonation.findMany({
        where: {
            status: { in: ["SCHEDULED", "CLAIMED"] },
            scheduledFor: { gte: windowStart, lte: windowEnd },
            reminderSentAt: null,
        },
        include: {
            food: { select: { title: true, quantity: true, unit: true, pickupLocation: true, pickupWindow: true } },
            donor: { select: { id: true, name: true, email: true } },
            ngo: { select: { id: true, name: true, email: true } },
        },
    });

    for (const s of due) {
        notifService.push(
            s.donor.id,
            "Upcoming pickup reminder",
            `Your scheduled donation "${s.food?.title}" is due within ${REMINDER_HOURS} hour(s).`,
            "info",
            "/donor/scheduled"
        );

        if (s.donor?.email) {
            emailService.sendPickupReminder({
                to: s.donor.email,
                name: s.donor.name,
                role: "DONOR",
                foodTitle: s.food?.title,
                quantity: s.food?.quantity,
                unit: s.food?.unit,
                pickupLocation: s.food?.pickupLocation,
                pickupWindow: s.food?.pickupWindow,
                scheduledFor: s.scheduledFor,
                hoursLeft: REMINDER_HOURS,
            }).catch((err) => console.error("Failed to send donor reminder email:", err.message));
        }

        if (s.ngo) {
            notifService.push(
                s.ngo.id,
                "Upcoming pickup reminder",
                `A scheduled donation "${s.food?.title}" is due within ${REMINDER_HOURS} hour(s).`,
                "info",
                "/ngo/scheduled"
            );

            if (s.ngo.email) {
                emailService.sendPickupReminder({
                    to: s.ngo.email,
                    name: s.ngo.name,
                    role: "NGO",
                    foodTitle: s.food?.title,
                    quantity: s.food?.quantity,
                    unit: s.food?.unit,
                    pickupLocation: s.food?.pickupLocation,
                    pickupWindow: s.food?.pickupWindow,
                    scheduledFor: s.scheduledFor,
                    hoursLeft: REMINDER_HOURS,
                }).catch((err) => console.error("Failed to send NGO reminder email:", err.message));
            }
        }
        await prisma.scheduledDonation.update({
            where: { id: s.id },
            data: { reminderSentAt: new Date() },
        });
    }
    return due.length;
};

let reminderJobTimer = null;
const startReminderJob = () => {
    if (reminderJobTimer) return;
    const run = () => sendReminders().catch((err) => console.error("Reminder job error:", err?.message || err));
    run(); // run once at boot
    reminderJobTimer = setInterval(run, REMINDER_INTERVAL_MS);
    reminderJobTimer.unref?.(); // don't hold the process open
};

module.exports = {
    create, listForDonor, listForNgo, accept, reschedule, cancel,
    sendReminders, startReminderJob, REMINDER_INTERVAL_MS, REMINDER_HOURS,
};
