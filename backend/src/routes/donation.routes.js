const express = require("express");
const router = express.Router();
const { claimFood, getMyDonations, getMyClaimedFoods, getDonationById, updateDonationStatus } = require("../controllers/donation.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { updateDonationStatusSchema } = require("../validations/donation.validation");

router.post("/claim/:foodId",  protect, claimFood);
router.get("/my-donations",    protect, getMyDonations);
router.get("/my-claims",       protect, getMyClaimedFoods);
router.get("/:id",             protect, getDonationById);
router.put("/:id/status",      protect, validate(updateDonationStatusSchema), updateDonationStatus);

module.exports = router;
