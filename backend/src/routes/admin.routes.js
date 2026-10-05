const express = require("express");
const router = express.Router();
const { getDashboard, listUsers, deleteUser, listFoods, listDonations, moderateFood, deleteFood } = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// All admin routes require JWT + ADMIN role
router.use(protect, restrictTo("ADMIN"));

router.get("/dashboard",          getDashboard);
router.get("/users",              listUsers);
router.delete("/users/:id",       deleteUser);
router.get("/foods",              listFoods);
router.patch("/foods/:id/status", moderateFood);
router.delete("/foods/:id",       deleteFood);
router.get("/donations",          listDonations);

module.exports = router;
