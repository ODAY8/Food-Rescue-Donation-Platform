const express = require("express");
const router = express.Router();
const { createFood, getAllFoods, getFoodById, getMyFoods, updateFood, deleteFood } = require("../controllers/food.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createFoodSchema, updateFoodSchema } = require("../validations/food.validation");

// Public
router.get("/",       getAllFoods);
router.get("/my",     protect, getMyFoods);
router.get("/:id",    getFoodById);

// Donor only
router.post("/",      protect, restrictTo("DONOR"), validate(createFoodSchema), createFood);
router.put("/:id",    protect, restrictTo("DONOR"), validate(updateFoodSchema), updateFood);
router.delete("/:id", protect, restrictTo("DONOR"), deleteFood);

module.exports = router;
