const searchService = require("../services/search.service");

const searchFoods = async (req, res) => {
    try {
        const result = await searchService.searchFoods(req.query, req.user || null);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getRecommendations = async (req, res) => {
    try {
        // NGO-focused ranking of available food.
        const { data } = await searchService.searchFoods({ availability: "true", limit: 50 }, req.user);
        const ranked = searchService.rankForNgo(data, req.user);
        res.status(200).json({ success: true, data: ranked, count: ranked.length });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { searchFoods, getRecommendations };
