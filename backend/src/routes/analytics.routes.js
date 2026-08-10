const express = require("express");
const router = express.Router();
const { getPlatformStats, getPublicStats, getMyStats } = require("../controllers/analytics.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.get("/public",  getPublicStats);                        // non-sensitive headline counts
router.get("/platform", protect, restrictTo("ADMIN"), getPlatformStats);
router.get("/me",       protect, getMyStats);

module.exports = router;
