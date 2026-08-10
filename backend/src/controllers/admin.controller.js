const userService      = require("../services/user.service");
const foodService      = require("../services/food.service");
const donationService  = require("../services/donation.service");
const analyticsService = require("../services/analytics.service");
const prisma           = require("../config/prisma");

const getDashboard = async (req, res) => {
    try {
        const result = await analyticsService.getPlatformStats();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const listUsers = async (req, res) => {
    try {
        const result = await userService.getAllUsers(req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const listFoods = async (req, res) => {
    try {
        const result = await foodService.getAllFoods(req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const listDonations = async (req, res) => {
    try {
        const result = await donationService.listAllDonations(req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const moderateFood = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["AVAILABLE", "CLAIMED", "EXPIRED"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        await prisma.food.update({ where: { id: req.params.id }, data: { status } });
        res.status(200).json({ success: true, message: `Food status set to ${status}` });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteFood = async (req, res) => {
    try {
        await prisma.food.delete({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "Food listing deleted by admin" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getDashboard, listUsers, deleteUser, listFoods, listDonations, moderateFood, deleteFood };
