const express = require("express");
const router = express.Router();
const { claimFood, getMyDonations, getMyClaimedFoods, getDonationById, updateDonationStatus } = require("../controllers/donation.controller");
const { generateQr, getByCode, validateCode, confirmCollection, confirmDelivery } = require("../controllers/qr.controller");
const { createSchedule, listDonorSchedules, listNgoSchedules, acceptSchedule, reschedule, cancelSchedule } = require("../controllers/schedule.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { updateDonationStatusSchema } = require("../validations/donation.validation");
const { createScheduleSchema, rescheduleSchema, qrValidateSchema } = require("../validations/schedule.validation");

// ── V2: scheduled donations ────────────────────────────────────────────────
router.post("/schedule",            protect, restrictTo("DONOR"), validate(createScheduleSchema), createSchedule);
router.get("/scheduled",            protect, listDonorSchedules);          // donor: own schedules
router.get("/scheduled/ngo",        protect, restrictTo("NGO"), listNgoSchedules); // NGO: open schedules
router.put("/scheduled/:id",        protect, validate(rescheduleSchema), reschedule);
router.post("/scheduled/:id/cancel", protect, cancelSchedule);
router.post("/scheduled/:id/accept", protect, restrictTo("NGO"), acceptSchedule);

// ── V2: QR codes ───────────────────────────────────────────────────────────
router.get("/qr/:code",             protect, getByCode);        // resolve by scanned code
router.post("/qr/validate",         protect, validate(qrValidateSchema), validateCode);

// ── V1: donations ──────────────────────────────────────────────────────────
router.post("/claim/:foodId",       protect, claimFood);
router.get("/my-donations",         protect, getMyDonations);
router.get("/my-claims",            protect, getMyClaimedFoods);
router.get("/:id",                  protect, getDonationById);
router.put("/:id/status",           protect, validate(updateDonationStatusSchema), updateDonationStatus);

// ── V2: QR-confirmed collection/delivery (after /:id is matched) ───────────
router.post("/:id/qr",              protect, generateQr);
router.post("/:id/scan/collect",    protect, confirmCollection);
router.post("/:id/scan/deliver",    protect, confirmDelivery);

module.exports = router;
