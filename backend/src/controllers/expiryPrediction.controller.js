const expiryPredictionService = require("../services/expiryPrediction.service");
const FoodModel = require("../models/food.model");

const getPrediction = async (req, res) => {
    try {
        const food = await FoodModel.findById(req.params.id);
        if (!food) return res.status(404).json({ success: false, message: "Food listing not found" });
        const result = await expiryPredictionService.predictForFood(food);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const refreshPrediction = async (req, res) => {
    try {
        const food = await FoodModel.findById(req.params.id);
        if (!food) return res.status(404).json({ success: false, message: "Food listing not found" });
        // Only the owner or an admin can force a refresh.
        if (food.donorId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ success: false, message: "Not authorized to refresh this prediction" });
        }
        const result = await expiryPredictionService.predictForFood(food, { force: true });
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getPrediction, refreshPrediction };
