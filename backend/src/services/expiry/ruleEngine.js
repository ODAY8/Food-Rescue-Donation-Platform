// Deterministic rule-based expiry risk engine.
// Produces { urgency, riskScore, recommendation, explanation } from food
// attributes. Fully offline; the LLM is only an optional enhancement layered
// on top (see expiryPrediction.service.js).

// Category perishability weight (0 = very perishable … 1 = shelf-stable)
const CATEGORY_FRESHNESS = {
    Produce: 0.35,
    Dairy: 0.30,
    Bakery: 0.45,
    Meat: 0.20,
    Prepared: 0.40,
    Beverages: 0.55,
    Pantry: 0.90,
    Other: 0.60,
};

// Storage-condition multiplier (higher = faster spoilage)
const STORAGE_MULT = { ROOM_TEMP: 1.0, REFRIGERATED: 0.55, FROZEN: 0.15 };

// Packaging multiplier (higher = faster spoilage)
const PACKAGING_MULT = { OPEN: 1.0, SEALED: 0.75, VACUUM_SEALED: 0.5, CANNED: 0.3 };

const URGENCY_THRESHOLDS = [
    { max: 0.25, level: "CRITICAL" },
    { max: 0.50, level: "HIGH" },
    { max: 0.80, level: "MEDIUM" },
    { max: Infinity, level: "LOW" },
];

const RECOMMENDATIONS = {
    CRITICAL: "Donate immediately — remaining shelf life is very short.",
    HIGH: "Prioritize this donation within the next few hours.",
    MEDIUM: "Donate within the recommended window before expiry.",
    LOW: "Shelf life is comfortable; schedule donation normally.",
};

/**
 * Compute the rule-based risk score for a food listing.
 * @param {object} food - Prisma Food row (title, category, quantity, unit,
 *   expiryDate, preparationDate?, storageCondition?, packaging?, temperature?)
 * @returns {{ urgency: string, riskScore: number, recommendation: string,
 *             explanation: string[], model: string }}
 */
function computeRuleScore(food) {
    const now = Date.now();
    const expiryMs = new Date(food.expiryDate).getTime();
    const remainingMs = expiryMs - now;
    const explanation = [];

    // 1. Remaining shelf-life fraction relative to a 48h reference window.
    const shelfFraction = Math.max(0, Math.min(1, remainingMs / (48 * 60 * 60 * 1000)));
    const timeFactor = 1 - shelfFraction; // 0 (far out) → 1 (expiring now)
    explanation.push(
        remainingMs <= 0
            ? "already past the expiry date"
            : `remaining shelf life is ${Math.max(0, Math.round(remainingMs / (60 * 60 * 1000)))} hour(s)`
    );

    // 2. Category perishability.
    const catFactor = 1 - (CATEGORY_FRESHNESS[food.category] ?? 0.6);
    explanation.push(`${food.category || "Uncategorized"} is ${catFactor > 0.5 ? "highly" : "moderately"} perishable`);

    // 3. Storage condition.
    const storageFactor = STORAGE_MULT[food.storageCondition] ?? 0.8;
    explanation.push(
        food.storageCondition
            ? `stored ${String(food.storageCondition).toLowerCase().replace("_", " ")}`
            : "storage condition unknown"
    );

    // 4. Packaging.
    const packagingFactor = PACKAGING_MULT[food.packaging] ?? 0.8;
    if (food.packaging) {
        explanation.push(`packaging is ${String(food.packaging).toLowerCase().replace("_", " ")}`);
    }

    // 5. Temperature deviation (treat above 4°C as accelerated spoilage).
    let tempFactor = 0;
    if (typeof food.temperature === "number") {
        tempFactor = Math.max(0, (food.temperature - 4) / 10); // 0 at ≤4°C, 1 at 14°C
        explanation.push(`storage temperature ${food.temperature}°C`);
    }

    // 6. Preparation date recency (freshly prepared food spoils sooner if short-dated).
    let prepFactor = 0;
    if (food.preparationDate) {
        const prepMs = new Date(food.preparationDate).getTime();
        if (prepMs > now) prepFactor = 0.05; // future prep date — treat as fresh
        else prepFactor = Math.min(0.1, (now - prepMs) / (7 * 24 * 60 * 60 * 1000));
        explanation.push("prepared recently");
    }

    // Risk = weighted combination of factors.
    const raw =
        timeFactor * 0.50 +
        catFactor * 0.20 +
        (1 - storageFactor) * 0.10 +
        (1 - packagingFactor) * 0.10 +
        tempFactor * 0.05 +
        prepFactor * 0.05;

    const riskScore = Math.max(0, Math.min(100, Math.round(raw * 100)));

    // Urgency from thresholds.
    const urgency = (URGENCY_THRESHOLDS.find((t) => riskScore / 100 <= t.max) || URGENCY_THRESHOLDS[3]).level;

    return {
        urgency,
        riskScore,
        recommendation: RECOMMENDATIONS[urgency],
        explanation,
        model: "rules",
    };
}

module.exports = { computeRuleScore };
