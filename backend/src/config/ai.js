// AI provider configuration (Groq, OpenAI-compatible).
// All values come from environment variables; never hardcode keys.
module.exports = {
    isAiEnabled: () => Boolean(process.env.GROQ_API_KEY),
    baseUrl: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
    visionModel: process.env.AI_VISION_MODEL || "llama-3.2-90b-vision-preview",
    classificationModel: process.env.AI_CLASSIFICATION_MODEL || "llama-3.3-70b-versatile",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS, 10) || 15000,
    apiKey: process.env.GROQ_API_KEY,
};
