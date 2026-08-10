// Multer configuration for food image uploads (local disk storage).
// Enforces: whitelisted mimetypes, size cap, random hex filenames.
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const MAX_IMAGE_MB = parseInt(process.env.MAX_IMAGE_MB, 10) || 5;

const ABS_UPLOAD_DIR = path.join(process.cwd(), UPLOAD_DIR);
const FOOD_IMG_DIR = path.join(ABS_UPLOAD_DIR, "foods");

// Ensure directories exist at startup.
for (const dir of [ABS_UPLOAD_DIR, FOOD_IMG_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const MIME_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, FOOD_IMG_DIR),
    filename: (req, file, cb) => {
        const ext = MIME_EXT[file.mimetype] || ".jpg";
        cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (MIME_EXT[file.mimetype]) cb(null, true);
    else cb(new Error("Invalid file type. Only JPEG, PNG, or WebP images are allowed."));
};

const uploadFoodImage = multer({
    storage,
    limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
    fileFilter,
});

module.exports = { uploadFoodImage, ABS_UPLOAD_DIR, FOOD_IMG_DIR, MAX_IMAGE_MB, MIME_EXT };
