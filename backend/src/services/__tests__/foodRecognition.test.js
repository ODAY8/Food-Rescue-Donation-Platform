const { describe, test } = require("node:test");
const assert = require("node:assert");
const { sniffMime, sanitizeRecognition, validateImage, MAX_IMAGE_BYTES, MIN_CONFIDENCE } = require("../foodRecognition.service");

const PNG_HEADER = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489", "hex");
const JPEG_HEADER = Buffer.from("ffd8ffe000104a46494600010100000100010000", "hex");
const validPng = Buffer.concat([PNG_HEADER, Buffer.alloc(100)]);

describe("sniffMime", () => {
    test("detects JPEG from magic bytes", () => {
        assert.strictEqual(sniffMime(JPEG_HEADER), "image/jpeg");
    });
    test("detects PNG from magic bytes", () => {
        assert.strictEqual(sniffMime(PNG_HEADER), "image/png");
    });
    test("returns null for garbage", () => {
        assert.strictEqual(sniffMime(Buffer.from("not-an-image")), null);
    });
});

describe("validateImage", () => {
    test("accepts a valid PNG buffer", () => {
        assert.strictEqual(validateImage(validPng), "image/png");
    });
    test("rejects an empty buffer", () => {
        assert.throws(() => validateImage(Buffer.alloc(0)), /No image file/);
    });
    test("rejects an oversized image", () => {
        const big = Buffer.concat([PNG_HEADER, Buffer.alloc(MAX_IMAGE_BYTES + 1)]);
        assert.throws(() => validateImage(big), /too large/);
    });
    test("rejects invalid magic bytes", () => {
        assert.throws(() => validateImage(Buffer.from("garbage!!!")), /Invalid image file/);
    });
});

describe("sanitizeRecognition", () => {
    test("accepts valid AI output", () => {
        const s = sanitizeRecognition({ foodName: "Rice", category: "Prepared", confidence: 91, description: "Cooked rice" });
        assert.ok(s);
        assert.strictEqual(s.foodName, "Rice");
        assert.strictEqual(s.category, "Prepared");
        assert.strictEqual(s.confidence, 91);
    });
    test("rejects unknown category", () => {
        assert.strictEqual(sanitizeRecognition({ foodName: "X", category: "RocketFuel", confidence: 90 }), null);
    });
    test("rejects missing confidence", () => {
        assert.strictEqual(sanitizeRecognition({ foodName: "X", category: "Prepared" }), null);
    });
    test("clamps confidence to 0-100", () => {
        assert.strictEqual(sanitizeRecognition({ foodName: "X", category: "Prepared", confidence: 250 }).confidence, 100);
    });
});

describe("MIN_CONFIDENCE", () => {
    test("is a valid threshold", () => {
        assert.ok(MIN_CONFIDENCE >= 0 && MIN_CONFIDENCE <= 100);
    });
});
