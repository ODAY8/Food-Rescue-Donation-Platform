const prisma = require("../config/prisma");
const crypto = require("crypto");
const QRCode = require("qrcode");
const DonationCodeModel = require("../models/donationCode.model");

const CODE_PREFIX = "FRD-";
const TTL_HOURS = parseInt(process.env.QR_CODE_TTL_HOURS, 10) || 168;

const generateCode = async (donationId, userId) => {
    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation) throw new Error("Donation not found");

    // Existing code for this donation → regenerate (donor/NGO/admin re-issue).
    const existing = await DonationCodeModel.findByDonationId(donationId);
    const token = crypto.randomBytes(16).toString("hex"); // 32 hex chars
    const code = `${CODE_PREFIX}${token}`;
    const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);

    const record = existing
        ? await DonationCodeModel.update(existing.id, { code, expiresAt, createdBy: userId })
        : await DonationCodeModel.create({ donationId, code, expiresAt, createdBy: userId });

    const qrDataUrl = await QRCode.toDataURL(code, { width: 256, margin: 1 });

    return {
        success: true,
        data: { id: record.id, code, qrDataUrl, expiresAt },
    };
};

const resolveCode = async (code) => {
    const record = await DonationCodeModel.findByCode(code);
    if (!record) throw new Error("Invalid QR code");
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
        throw new Error("QR code has expired");
    }
    return record;
};

const recordScan = async (codeId) => {
    await DonationCodeModel.recordScan(codeId);
};

// Resolve + authorize a QR code to a donation, with scan counting.
// Any authenticated user gets a summary; full detail only for donor/NGO/admin.
const resolveAndAuthorize = async (code, userId, userRole) => {
    const record = await resolveCode(code);
    const donation = await prisma.donation.findUnique({
        where: { id: record.donationId },
        include: { food: { select: { id: true, title: true, pickupLocation: true, city: true } } },
    });
    if (!donation) throw new Error("Donation not found");

    await recordScan(record.id);

    const isDonor = donation.donorId === userId;
    const isNgo = donation.ngoId === userId;
    const isAdmin = userRole === "ADMIN";
    const authorized = isDonor || isNgo || isAdmin;

    const summary = {
        code: record.code,
        status: donation.status,
        foodTitle: donation.food?.title,
        pickupLocation: donation.food?.pickupLocation,
        city: donation.food?.city,
        scheduledAt: donation.pickupScheduledAt,
        authorized: isAdmin ? true : authorized, // full info for admin
    };

    if (authorized) {
        return {
            success: true,
            data: { ...summary, full: true, donation },
        };
    }
    return {
        success: true,
        data: { ...summary, full: false },
    };
};

module.exports = { generateCode, resolveCode, recordScan, resolveAndAuthorize, CODE_PREFIX };
