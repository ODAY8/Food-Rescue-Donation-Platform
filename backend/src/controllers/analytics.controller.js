const analyticsService = require("../services/analytics.service");

const getPlatformStats = async (req, res) => {
    try {
        const result = await analyticsService.getPlatformStats();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getPublicStats = async (req, res) => {
    try {
        const result = await analyticsService.getPublicStats();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMyStats = async (req, res) => {
    try {
        const result = await analyticsService.getMyStats(req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPlatformStats, getPublicStats, getMyStats };
