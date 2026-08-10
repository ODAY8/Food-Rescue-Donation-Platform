const { callJsonCompletion } = require("./ai/ai.client");
const { buildRecognitionSystemPrompt, buildRecognitionUserPrompt } = require("./ai/foodPrompts");
const { FOOD_CATEGORIES } = require("../validations/food.validation");

const MIN_CONFIDENCE = 50;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// Detect the real file type from magic bytes (not the client-provided mimetype).
const sniffMime = (buffer) => {
    if (!buffer || buffer.length < 4) return null;
    const hex = buffer.subarray(0, 4).toString("hex");
    if (hex.startsWith("ffd8ff")) return "image/jpeg";
    if (hex.startsWith("89504e47")) return "image/png";
    if (hex.startsWith("52494646")) return "image/webp"; // RIFF....WEBP
    return null;
};

const isWebp = (buffer) => {
    if (buffer.length < 12) return false;
    return (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
};

const validateImage = (buffer) => {
    if (!buffer || buffer.length === 0) throw new Error("No image file provided");
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Image file is too large (max 5MB)");
    const mime = sniffMime(buffer);
    if (!mime) throw new Error("Invalid image file. Only JPEG, PNG, or WebP are allowed");
    return mime;
};

// Validate AI recognition output against our category enum + confidence floor.
const sanitizeRecognition = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const confidence = Number(raw.confidence);
    if (!Number.isFinite(confidence)) return null;
    const category = String(raw.category || "");
    if (!FOOD_CATEGORIES.includes(category)) return null;
    const foodName = typeof raw.foodName === "string" ? raw.foodName.trim().slice(0, 150) : "";
    if (!foodName) return null;
    return {
        foodName,
        category,
        confidence: Math.max(0, Math.min(100, Math.round(confidence))),
        description: typeof raw.description === "string" ? raw.description.slice(0, 500) : "",
    };
};

/**
 * Recognize food from an image buffer.
 * Always resolves; never throws for AI reasons.
 * @returns {{ success: boolean, data: { suggestion: object|null, manualEntry: boolean, source: string } }}
 */
const recognizeImage = async (buffer) => {
    const mime = validateImage(buffer);
    const base64 = buffer.toString("base64");

    try {
        const raw = await callJsonCompletion({
            model: require("../../config/ai").visionModel,
            messages: [buildRecognitionSystemPrompt(), buildRecognitionUserPrompt()],
            images: [{ mime, base64 }],
        });
        const suggestion = sanitizeRecognition(raw);
        if (suggestion && suggestion.confidence >= MIN_CONFIDENCE) {
            return {
                success: true,
                data: { suggestion, manualEntry: false, source: "ai" },
            };
        }
        // Low confidence or unrecognized → let the user enter it manually.
        return {
            success: true,
            data: { suggestion: suggestion || null, manualEntry: true, source: suggestion ? "ai-low-confidence" : "ai-unrecognized" },
        };
    } catch (e) {
        return {
            success: true,
            data: { suggestion: null, manualEntry: true, source: "ai-unavailable" },
        };
    }
};

module.exports = { recognizeImage, validateImage, sniffMime, sanitizeRecognition, MIN_CONFIDENCE, MAX_IMAGE_BYTES };
