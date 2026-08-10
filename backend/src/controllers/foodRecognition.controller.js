const foodRecognitionService = require("../services/foodRecognition.service");

const recognizeImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No image file provided" });
        const result = await foodRecognitionService.recognizeImage(req.file.buffer);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { recognizeImage };
