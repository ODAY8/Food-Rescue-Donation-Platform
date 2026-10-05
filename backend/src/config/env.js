require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET"];

required.forEach((key) => {
    if (!process.env[key]) {
        console.error(`❌ Missing required env var: ${key}`);
        process.exit(1);
    }
});

module.exports = {
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    NODE_ENV: process.env.NODE_ENV || "development",

    // Version 2.0 — AI (Groq)
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    AI_BASE_URL: process.env.AI_BASE_URL || "https://api.groq.com/openai/v1",
    AI_VISION_MODEL: process.env.AI_VISION_MODEL || "llama-3.2-90b-vision-preview",
    AI_CLASSIFICATION_MODEL: process.env.AI_CLASSIFICATION_MODEL || "llama-3.3-70b-versatile",
    AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS, 10) || 15000,

    // Version 2.0 — uploads
    UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
    MAX_IMAGE_MB: parseInt(process.env.MAX_IMAGE_MB, 10) || 5,

    // Version 2.0 — QR
    QR_CODE_TTL_HOURS: parseInt(process.env.QR_CODE_TTL_HOURS, 10) || 168,

    // Version 2.0 — schedules
    SCHEDULE_REMINDER_HOURS: parseInt(process.env.SCHEDULE_REMINDER_HOURS, 10) || 2,
    SCHEDULE_REMINDER_INTERVAL_MS: parseInt(process.env.SCHEDULE_REMINDER_INTERVAL_MS, 10) || 15 * 60 * 1000,
};
