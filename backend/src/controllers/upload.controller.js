const uploadFoodImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No image file provided" });
        // Return a relative URL the client can pass to createFood's imageUrl.
        const url = `/uploads/foods/${req.file.filename}`;
        res.status(201).json({ success: true, data: { url, filename: req.file.filename, size: req.file.size } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { uploadFoodImage };
