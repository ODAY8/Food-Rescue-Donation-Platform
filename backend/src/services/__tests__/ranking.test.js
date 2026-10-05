const { describe, test } = require("node:test");
const assert = require("node:assert");
const { haversineKm, rankForNgo } = require("../search.service");

describe("haversineKm", () => {
    test("returns 0 for identical coordinates", () => {
        assert.strictEqual(haversineKm(-1.2921, 36.8219, -1.2921, 36.8219), 0);
    });
    test("returns ~a positive distance for Nairobi to Mombasa", () => {
        const d = haversineKm(-1.2921, 36.8219, -4.0435, 39.6682);
        assert.ok(d > 400 && d < 500);
    });
});

const makeFood = (overrides = {}) => ({
    id: "f-" + Math.random().toString(36).slice(2),
    title: "Food",
    quantity: 10,
    unit: "kg",
    expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    latitude: -1.29,
    longitude: 36.82,
    ...overrides,
});

describe("rankForNgo", () => {
    test("sorts by matchScore descending", () => {
        const urgent = makeFood({ expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), quantity: 90 });
        const stale = makeFood({ expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), quantity: 5 });
        const ranked = rankForNgo([stale, urgent], { latitude: -1.29, longitude: 36.82 });
        assert.strictEqual(ranked[0].id, urgent.id);
    });

    test("marks expiring-soon food with a reason", () => {
        const food = makeFood({ expiryDate: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString() });
        const ranked = rankForNgo([food], { latitude: -1.29, longitude: 36.82 });
        assert.ok(ranked[0].matchReasons.includes("expiring soon"));
    });

    test("marks nearby food with a reason", () => {
        const food = makeFood({});
        const ranked = rankForNgo([food], { latitude: -1.29, longitude: 36.82 });
        assert.ok(ranked[0].matchReasons.includes("nearby"));
    });

    test("marks large quantity with a reason", () => {
        const food = makeFood({ quantity: 150 });
        const ranked = rankForNgo([food], { latitude: -1.29, longitude: 36.82 });
        assert.ok(ranked[0].matchReasons.includes("large quantity"));
    });

    test("handles an NGO without coordinates", () => {
        const food = makeFood({});
        const ranked = rankForNgo([food], {});
        assert.ok(ranked[0].matchScore >= 0 && ranked[0].matchScore <= 100);
    });

    test("returns score in 0-100 range", () => {
        const ranked = rankForNgo([makeFood({})], { latitude: -1.29, longitude: 36.82 });
        assert.ok(ranked[0].matchScore >= 0 && ranked[0].matchScore <= 100);
    });
});
