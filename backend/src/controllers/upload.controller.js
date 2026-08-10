const fs = require("fs");
const { sniffMime } = require("../services/foodRecognition.service");

const uploadFoodImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No image file provided" });

        // Verify real file content via magic bytes — never trust the client mimetype.
        const actualMime = sniffMime(req.file.buffer || fs.readFileSync(req.file.path));
        if (!actualMime || actualMime !== req.file.mimetype) {
            fs.unlink(req.file.path, () => {});
            return res.status(400).json({ success: false, message: "Invalid image file. Only JPEG, PNG, or WebP are allowed" });
        }

        // Return a relative URL the client can pass to createFood's imageUrl.
        const url = `/uploads/foods/${req.file.filename}`;
        res.status(201).json({ success: true, data: { url, filename: req.file.filename, size: req.file.size } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { uploadFoodImage };
