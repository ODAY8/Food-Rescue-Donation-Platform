const prisma = require("../config/prisma");
const crypto = require("crypto");
const { computeRuleScore } = require("./expiry/ruleEngine");
const { callJsonCompletion } = require("./ai/ai.client");
const {
    buildPredictionPrompt,
    buildPredictionUserPrompt,
    SAFETY_DISCLAIMER,
} = require("./ai/foodPrompts");

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const VALID_URGENCIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Build a canonical feature snapshot + SHA-256 hash for cache invalidation.
const buildFeaturesHash = (food) => {
    const snapshot = JSON.stringify({
        title: food.title?.toLowerCase() || "",
        category: food.category || "Other",
        quantity: food.quantity ?? null,
        unit: food.unit || "kg",
        preparationDate: food.preparationDate?.toISOString() || null,
        expiryDate: food.expiryDate?.toISOString() || null,
        storageCondition: food.storageCondition || null,
        packaging: food.packaging || null,
        temperature: food.temperature ?? null,
    });
    return crypto.createHash("sha256").update(snapshot).digest("hex");
};

// Validate/normalize an LLM prediction so AI output can never corrupt DB
// enums or inject arbitrary recommendation text.
const sanitizeLlmPrediction = (raw, fallback) => {
    if (!raw || typeof raw !== "object") return null;
    const urgency = String(raw.urgency || "").toUpperCase();
    if (!VALID_URGENCIES.includes(urgency)) return null;
    const riskScore = Number(raw.riskScore);
    if (!Number.isFinite(riskScore)) return null;
    const explanation = Array.isArray(raw.explanation)
        ? raw.explanation
              .filter((e) => typeof e === "string")
              .map((e) => String(e).slice(0, 200))
              .slice(0, 6)
        : [];
    const recommendation = typeof raw.recommendation === "string"
        ? raw.recommendation.slice(0, 255)
        : fallback.recommendation;
    return {
        urgency,
        riskScore: Math.max(0, Math.min(100, Math.round(riskScore))),
        recommendation: recommendation || fallback.recommendation,
        explanation: explanation.length > 0 ? explanation : fallback.explanation,
        model: "groq",
    };
};

const predictForFood = async (food, { force = false, aiEnabled = true } = {}) => {
    const featuresHash = buildFeaturesHash(food);

    if (!force) {
        const cached = await prisma.expiryPrediction.findUnique({ where: { foodId: food.id } });
        const fresh = cached && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_TTL_MS;
        if (cached && fresh && cached.featuresHash === featuresHash) {
            return {
                success: true,
                data: { prediction: cached, cached: true, disclaimer: SAFETY_DISCLAIMER },
            };
        }
    }

    // 1. Deterministic rule engine (always available).
    const rule = computeRuleScore(food);

    // 2. Optional LLM enrichment — validated, dropped on any failure.
    let result = rule;
    if (aiEnabled) {
        try {
            const raw = await callJsonCompletion({
                model: require("../config/ai").classificationModel,
                messages: [buildPredictionPrompt(food), buildPredictionUserPrompt(food)],
            });
            const enriched = sanitizeLlmPrediction(raw, rule);
            if (enriched) result = { ...enriched, explanation: enriched.explanation, model: "groq" };
        } catch (e) {
            // Fall back to rules; never fail the request because of AI.
        }
    }

    const prediction = await prisma.expiryPrediction.upsert({
        where: { foodId: food.id },
        update: {
            featuresHash,
            urgency: result.urgency,
            riskScore: result.riskScore,
            recommendation: result.recommendation,
            explanation: { factors: result.explanation, model: result.model },
            model: result.model,
        },
        create: {
            foodId: food.id,
            featuresHash,
            urgency: result.urgency,
            riskScore: result.riskScore,
            recommendation: result.recommendation,
            explanation: { factors: result.explanation, model: result.model },
            model: result.model,
        },
    });

    return {
        success: true,
        data: {
            prediction: { ...prediction, disclaimer: SAFETY_DISCLAIMER },
            cached: false,
            disclaimer: SAFETY_DISCLAIMER,
        },
    };
};

module.exports = { predictForFood, computeRuleScore, buildFeaturesHash, sanitizeLlmPrediction, CACHE_TTL_MS };
