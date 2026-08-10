const donationService = require("../services/donation.service");

const claimFood = async (req, res) => {
    try {
        const result = await donationService.claimFood(req.params.foodId, req.user.id);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getMyDonations = async (req, res) => {
    try {
        const result = await donationService.getMyDonations(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyClaimedFoods = async (req, res) => {
    try {
        const result = await donationService.getMyClaimedFoods(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDonationById = async (req, res) => {
    try {
        const result = await donationService.getDonationById(req.params.id, req.user.id, req.user.role);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.message === "Not authorized to view this donation" ? 403 : 404)
           .json({ success: false, message: error.message });
    }
};

const updateDonationStatus = async (req, res) => {
    try {
        const result = await donationService.updateDonationStatus(req.params.id, req.body.status, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = { claimFood, getMyDonations, getMyClaimedFoods, getDonationById, updateDonationStatus };
