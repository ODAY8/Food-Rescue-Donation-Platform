const foodService = require("../services/food.service");

const createFood = async (req, res) => {
    try {
        const result = await foodService.createFood(req.body, req.user.id);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getAllFoods = async (req, res) => {
    try {
        const result = await foodService.getAllFoods(req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getFoodById = async (req, res) => {
    try {
        const result = await foodService.getFoodById(req.params.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const getMyFoods = async (req, res) => {
    try {
        const result = await foodService.getMyFoods(req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateFood = async (req, res) => {
    try {
        const result = await foodService.updateFood(req.params.id, req.body, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteFood = async (req, res) => {
    try {
        const result = await foodService.deleteFood(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { createFood, getAllFoods, getFoodById, getMyFoods, updateFood, deleteFood };
