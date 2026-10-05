const qrService = require("../services/qr.service");
const DonationModel = require("../models/donation.model");

// Helper: ensure the requesting user can access the donation (donor/NGO/admin).
const assertCanAccess = async (donationId, userId, userRole) => {
    const donation = await DonationModel.findById(donationId);
    if (!donation) throw new Error("Donation not found");
    const isDonor = donation.donorId === userId;
    const isNgo = donation.ngoId === userId;
    if (!isDonor && !isNgo && userRole !== "ADMIN") {
        throw new Error("Not authorized to access this donation");
    }
    return donation;
};

const generateQr = async (req, res) => {
    try {
        await assertCanAccess(req.params.id, req.user.id, req.user.role);
        const result = await qrService.generateCode(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(403).json({ success: false, message: err.message });
    }
};

const getByCode = async (req, res) => {
    try {
        const result = await qrService.resolveAndAuthorize(req.params.code, req.user.id, req.user.role);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const validateCode = async (req, res) => {
    try {
        const record = await qrService.resolveCode(req.body.code);
        res.status(200).json({ success: true, data: { valid: true, donationId: record.donationId, status: record.status || null } });
    } catch (err) {
        res.status(200).json({ success: true, data: { valid: false, message: err.message } });
    }
};

// Confirm collection/delivery after scanning — reuse the donation state machine.
const confirmCollection = async (req, res) => {
    try {
        const donation = await assertCanAccess(req.params.id, req.user.id, req.user.role);
        if (donation.ngoId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Only the claiming NGO can confirm collection" });
        }
        const result = await require("../services/donation.service").updateDonationStatus(req.params.id, "COLLECTED", req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const confirmDelivery = async (req, res) => {
    try {
        const donation = await assertCanAccess(req.params.id, req.user.id, req.user.role);
        if (donation.ngoId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Only the claiming NGO can confirm delivery" });
        }
        const result = await require("../services/donation.service").updateDonationStatus(req.params.id, "DELIVERED", req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { generateQr, getByCode, validateCode, confirmCollection, confirmDelivery };
