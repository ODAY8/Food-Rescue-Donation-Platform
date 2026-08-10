// Prompt builders for the food-expiry prediction and image-recognition
// features. Kept separate so prompts are easy to tune without touching logic.
const { FOOD_CATEGORIES } = require("../../validations/food.validation");

const SAFETY_DISCLAIMER =
    "This is an AI estimate to prioritize donation logistics. " +
    "It is NOT a food-safety certification. Always follow official food-safety guidelines.";

const buildPredictionPrompt = (food) => ({
    role: "system",
    content:
        "You are a food-donation logistics assistant. Given a food listing, estimate spoilage risk " +
        "and donation priority. Respond ONLY with a JSON object using exactly these keys: " +
        '"riskScore" (integer 0-100), "urgency" (one of LOW, MEDIUM, HIGH, CRITICAL), ' +
        '"recommendation" (short donation-priority advice), "explanation" (array of 1-4 short factor strings). ' +
        "Do not give food-safety guarantees.",
});
const buildPredictionUserPrompt = (food) => {
    const factors = {
        title: food.title,
        category: food.category,
        quantity: food.quantity,
        unit: food.unit,
        preparationDate: food.preparationDate ? food.preparationDate.toISOString() : null,
        expiryDate: food.expiryDate.toISOString(),
        storageCondition: food.storageCondition || null,
        packaging: food.packaging || null,
        temperature: food.temperature ?? null,
    };
    return { role: "user", content: `Analyze this food listing:\n${JSON.stringify(factors, null, 2)}` };
};

const buildRecognitionSystemPrompt = () => ({
    role: "system",
    content:
        `You are a food-image recognition assistant. Identify the food in the image and respond ONLY with ` +
        `a JSON object using exactly these keys: "foodName" (short name), "category" (one of ` +
        `${FOOD_CATEGORIES.join(", ")}), "confidence" (integer 0-100), "description" (one sentence). ` +
        "If you cannot identify the food confidently, set confidence to a low value.",
});
const buildRecognitionUserPrompt = () => ({
    role: "user",
    content: "What food is in this image? Respond with the JSON object.",
});

module.exports = {
    SAFETY_DISCLAIMER,
    buildPredictionPrompt,
    buildPredictionUserPrompt,
    buildRecognitionSystemPrompt,
    buildRecognitionUserPrompt,
};
