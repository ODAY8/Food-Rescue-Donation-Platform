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

        // Return full URL so external frontends (e.g. Vercel) can load directly from Render
        const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host = req.get("host");
        const fullUrl = host ? `${proto}://${host}/uploads/foods/${req.file.filename}` : `/uploads/foods/${req.file.filename}`;
        const relativeUrl = `/uploads/foods/${req.file.filename}`;

        res.status(201).json({
            success: true,
            data: {
                url: fullUrl,
                relativeUrl,
                filename: req.file.filename,
                size: req.file.size,
            },
        });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { uploadFoodImage };
