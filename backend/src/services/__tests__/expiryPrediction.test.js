require("dotenv").config();
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert");
const prisma = require("../../config/prisma");
const { predictForFood, buildFeaturesHash, sanitizeLlmPrediction } = require("../expiryPrediction.service");
const { computeRuleScore } = require("../expiry/ruleEngine");

// Pure-logic tests (no DB).
describe("buildFeaturesHash", () => {
    const food = {
        id: "x",
        title: "Cooked Rice",
        category: "Prepared",
        quantity: 30,
        unit: "kg",
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        preparationDate: null,
        storageCondition: "REFRIGERATED",
        packaging: "SEALED",
        temperature: null,
    };
    test("is stable for identical food", () => {
        assert.strictEqual(buildFeaturesHash(food), buildFeaturesHash({ ...food }));
    });
    test("changes when expiry changes", () => {
        const other = { ...food, expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000) };
        assert.notStrictEqual(buildFeaturesHash(food), buildFeaturesHash(other));
    });
});

describe("sanitizeLlmPrediction", () => {
    const fallback = { urgency: "HIGH", riskScore: 70, recommendation: "donate", explanation: ["x"] };
    test("accepts valid output", () => {
        const s = sanitizeLlmPrediction({ urgency: "HIGH", riskScore: 85, recommendation: "now", explanation: ["short shelf life"] }, fallback);
        assert.strictEqual(s.urgency, "HIGH");
        assert.strictEqual(s.riskScore, 85);
    });
    test("rejects invalid urgency", () => {
        assert.strictEqual(sanitizeLlmPrediction({ urgency: "URGENT!!!", riskScore: 85, recommendation: "x", explanation: [] }, fallback), null);
    });
    test("rejects non-numeric riskScore", () => {
        assert.strictEqual(sanitizeLlmPrediction({ urgency: "HIGH", riskScore: "abc", recommendation: "x", explanation: [] }, fallback), null);
    });
    test("clamps riskScore to 0-100", () => {
        assert.strictEqual(sanitizeLlmPrediction({ urgency: "HIGH", riskScore: 500, recommendation: "x", explanation: [] }, fallback).riskScore, 100);
    });
    test("falls back to rule recommendation when empty", () => {
        const s = sanitizeLlmPrediction({ urgency: "HIGH", riskScore: 50, recommendation: "", explanation: [] }, fallback);
        assert.strictEqual(s.recommendation, fallback.recommendation);
    });
});

describe("computeRuleScore sanity", () => {
    test("produces valid output for a typical food", () => {
        const r = computeRuleScore({
            title: "Rice",
            category: "Prepared",
            quantity: 30,
            expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        assert.ok(["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(r.urgency));
        assert.ok(r.riskScore >= 0 && r.riskScore <= 100);
        assert.ok(r.explanation.length > 0);
    });
});

// Integration: prediction caching round-trip on a real food row.
describe("predictForFood integration", () => {
    let foodId;
    before(async () => {
        const donor = await prisma.user.findFirst({ where: { role: "DONOR" } });
        if (!donor) throw new Error("Seed donor missing — run npm run seed");
        const food = await prisma.food.create({
            data: {
                donorId: donor.id,
                title: "Prediction Test " + Date.now(),
                description: "Integration prediction test",
                category: "Prepared",
                quantity: 10,
                unit: "servings",
                expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
                storageCondition: "REFRIGERATED",
            },
        });
        foodId = food.id;
    });
    after(async () => {
        await prisma.expiryPrediction.deleteMany({ where: { foodId } });
        await prisma.food.deleteMany({ where: { id: foodId } });
        await prisma.$disconnect();
    });

    test("computes + persists a prediction and returns the disclaimer", async () => {
        const food = await prisma.food.findUnique({ where: { id: foodId } });
        const res = await predictForFood(food, { aiEnabled: false });
        assert.ok(res.success);
        assert.ok(res.data.prediction.urgency);
        assert.ok(res.data.prediction.riskScore >= 0 && res.data.prediction.riskScore <= 100);
        assert.match(res.data.disclaimer, /NOT a food-safety certification/);

        const saved = await prisma.expiryPrediction.findUnique({ where: { foodId } });
        assert.ok(saved);
        assert.strictEqual(saved.featuresHash, res.data.prediction.featuresHash || buildFeaturesHash(food));
    });

    test("second call returns cached result", async () => {
        const food = await prisma.food.findUnique({ where: { id: foodId } });
        const first = await predictForFood(food, { force: true, aiEnabled: false });
        const second = await predictForFood(food, { aiEnabled: false });
        assert.strictEqual(first.data.cached, false);
        assert.strictEqual(second.data.cached, true);
        assert.strictEqual(first.data.prediction.urgency, second.data.prediction.urgency);
    });

    test("force refresh recomputes", async () => {
        const food = await prisma.food.findUnique({ where: { id: foodId } });
        const res = await predictForFood(food, { force: true, aiEnabled: false });
        assert.strictEqual(res.data.cached, false);
    });
});
