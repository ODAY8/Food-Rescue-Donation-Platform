const express = require("express");
const router = express.Router();
const { uploadFoodImage } = require("../controllers/upload.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadFoodImage: uploadMiddleware } = require("../config/multer");

// Authenticated food-image upload (local disk). Returns a relative /uploads URL.
router.post("/food-image", protect, uploadMiddleware.single("image"), uploadFoodImage);

module.exports = router;
