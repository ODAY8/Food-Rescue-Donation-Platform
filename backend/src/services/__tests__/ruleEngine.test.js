const { describe, test } = require("node:test");
const assert = require("node:assert");
const { computeRuleScore } = require("../expiry/ruleEngine");

const baseFood = {
    title: "Test Food",
    category: "Prepared",
    quantity: 10,
    unit: "kg",
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    preparationDate: null,
    storageCondition: null,
    packaging: null,
    temperature: null,
};

describe("computeRuleScore", () => {
    test("returns LOW urgency + low risk for far-future shelf life", () => {
        const food = {
            ...baseFood,
            category: "Pantry",
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            storageCondition: "ROOM_TEMP",
            packaging: "CANNED",
        };
        const r = computeRuleScore(food);
        assert.strictEqual(r.urgency, "LOW");
        assert.ok(r.riskScore >= 0 && r.riskScore <= 40);
        assert.ok(Array.isArray(r.explanation) && r.explanation.length > 0);
    });

    test("returns CRITICAL urgency + high risk for already-expired food", () => {
        const food = {
            ...baseFood,
            category: "Meat",
            expiryDate: new Date(Date.now() - 60 * 60 * 1000),
            storageCondition: "ROOM_TEMP",
            packaging: "OPEN",
        };
        const r = computeRuleScore(food);
        assert.strictEqual(r.urgency, "CRITICAL");
        assert.ok(r.riskScore >= 80);
        assert.match(r.recommendation, /Donate immediately/i);
    });

    test("treats refrigerated storage as lower risk than room temp", () => {
        const cold = computeRuleScore({ ...baseFood, storageCondition: "REFRIGERATED" });
        const warm = computeRuleScore({ ...baseFood, storageCondition: "ROOM_TEMP" });
        assert.ok(cold.riskScore < warm.riskScore);
    });

    test("treats canned packaging as lower risk than open", () => {
        const canned = computeRuleScore({ ...baseFood, packaging: "CANNED" });
        const open = computeRuleScore({ ...baseFood, packaging: "OPEN" });
        assert.ok(canned.riskScore < open.riskScore);
    });

    test("treats high temperature as higher risk", () => {
        const hot = computeRuleScore({ ...baseFood, temperature: 20 });
        const cold = computeRuleScore({ ...baseFood, temperature: 2 });
        assert.ok(hot.riskScore > cold.riskScore);
    });

    test("handles missing optional fields without crashing", () => {
        const r = computeRuleScore({ ...baseFood, storageCondition: undefined, packaging: undefined, temperature: undefined });
        assert.ok(["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(r.urgency));
        assert.ok(r.riskScore >= 0 && r.riskScore <= 100);
    });
});
