const v2AnalyticsService = require("../services/v2Analytics.service");

const getV2Stats = async (req, res) => {
    try {
        const result = await v2AnalyticsService.getV2Stats();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getV2Stats };
