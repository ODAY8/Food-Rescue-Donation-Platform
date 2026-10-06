const express = require("express");
const router = express.Router();
const { createFood, getAllFoods, getFoodById, getMyFoods, updateFood, deleteFood } = require("../controllers/food.controller");
const { getPrediction, refreshPrediction } = require("../controllers/expiryPrediction.controller");
const { recognizeImage } = require("../controllers/foodRecognition.controller");
const { searchFoods, getRecommendations } = require("../controllers/search.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate, validateQuery } = require("../middleware/validate.middleware");
const { createFoodSchema, updateFoodSchema } = require("../validations/food.validation");
const { searchQuerySchema } = require("../validations/search.validation");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { MAX_IMAGE_MB, MIME_EXT } = require("../config/multer");

// V2: memory upload for recognition (never written to disk).
const recognitionUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (MIME_EXT[file.mimetype]) cb(null, true);
        else cb(new Error("Invalid file type. Only JPEG, PNG, or WebP images are allowed."));
    },
});

// V2: recognition rate limit (AI cost protection).
const recognitionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many image recognition requests, please try again later." },
});

// V2: prediction-refresh rate limit (AI cost protection).
const predictionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many prediction requests, please try again later." },
});

// Public search (validated query) — registered before /:id
router.get("/search",            validateQuery(searchQuerySchema), searchFoods);
router.get("/recommendations",   protect, getRecommendations);
router.post("/recognize-image",  protect, restrictTo("DONOR"), recognitionLimiter, recognitionUpload.single("image"), recognizeImage);

// Public
router.get("/",       getAllFoods);
router.get("/my",     protect, getMyFoods);
router.get("/:id",    getFoodById);

// Prediction endpoints (cached GET; rate-limited force-refresh POST)
router.get("/:id/prediction",     getPrediction);
router.post("/:id/expiry-prediction", protect, predictionLimiter, refreshPrediction);

// Helper to ensure description is never missing or under 10 chars
const ensureDescription = (req, res, next) => {
    if (!req.body.description || req.body.description.trim().length < 10) {
        const title = req.body.title || "surplus food";
        req.body.description = req.body.description && req.body.description.trim().length > 0
            ? `${req.body.description.trim()} - surplus food available for donation.`
            : `Fresh surplus ${title} available for donation and immediate pickup.`;
    }
    next();
};

// Donor only
router.post("/",      protect, restrictTo("DONOR"), ensureDescription, validate(createFoodSchema), createFood);
router.put("/:id",    protect, restrictTo("DONOR"), validate(updateFoodSchema), updateFood);
router.delete("/:id", protect, restrictTo("DONOR"), deleteFood);


module.exports = router;
