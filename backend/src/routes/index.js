const express = require("express");
const router = express.Router();

const { getHome } = require("../controllers/home.controller");
const authRoutes         = require("./auth.routes");
const foodRoutes         = require("./food.routes");
const donationRoutes     = require("./donation.routes");
const userRoutes         = require("./user.routes");
const notificationRoutes = require("./notification.routes");
const analyticsRoutes    = require("./analytics.routes");
const adminRoutes        = require("./admin.routes");

router.get("/", getHome);

router.use("/api/auth",          authRoutes);
router.use("/api/foods",         foodRoutes);
router.use("/api/donations",     donationRoutes);
router.use("/api/users",         userRoutes);
router.use("/api/notifications", notificationRoutes);
router.use("/api/analytics",     analyticsRoutes);
router.use("/api/admin",         adminRoutes);

module.exports = router;
