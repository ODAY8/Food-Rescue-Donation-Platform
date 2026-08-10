require("dotenv").config();
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert");
const prisma = require("../../config/prisma");
const qrService = require("../qr.service");

describe("qrService integration", () => {
    let donor;
    let ngo;
    let stranger;
    let donationId;
    let code;

    before(async () => {
        donor = await prisma.user.findFirst({ where: { role: "DONOR" } });
        ngo = await prisma.user.findFirst({ where: { role: "NGO" } });
        stranger = await prisma.user.findFirst({ where: { role: "DONOR", id: { not: donor.id } } });
        if (!donor || !ngo) throw new Error("Seed users missing — run npm run seed");

        // Create a food + donation for QR testing.
        const food = await prisma.food.create({
            data: {
                donorId: donor.id,
                title: "QR Test " + Date.now(),
                description: "QR integration test",
                category: "Prepared",
                quantity: 5,
                unit: "servings",
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        const donation = await prisma.donation.create({
            data: { foodId: food.id, donorId: donor.id, ngoId: ngo.id, status: "PICKUP_SCHEDULED" },
        });
        donationId = donation.id;
    });

    after(async () => {
        if (donationId) {
            const donation = await prisma.donation.findUnique({ where: { id: donationId } });
            if (donation) {
                await prisma.donationCode.deleteMany({ where: { donationId } });
                await prisma.donation.delete({ where: { id: donationId } });
                await prisma.food.delete({ where: { id: donation.foodId } });
            }
        }
        await prisma.$disconnect();
    });

    test("generates a secure FRD- code", async () => {
        const res = await qrService.generateCode(donationId, donor.id);
        code = res.data.code;
        assert.match(code, /^FRD-[a-f0-9]{32}$/);
        assert.ok(res.data.qrDataUrl.startsWith("data:image/png"));
    });

    test("resolves the code and counts the scan", async () => {
        const res = await qrService.resolveAndAuthorize(code, ngo.id, "NGO");
        assert.strictEqual(res.data.full, true);
        assert.match(res.data.foodTitle, /^QR Test/);
        const rec = await prisma.donationCode.findUnique({ where: { code } });
        assert.ok(rec.scansCount >= 1);
        assert.ok(rec.lastScannedAt);
    });

    test("returns summary-only for an unrelated user (no IDOR leak)", async () => {
        const res = await qrService.resolveAndAuthorize(code, stranger.id, "DONOR");
        assert.strictEqual(res.data.full, false);
        assert.strictEqual(res.data.donation, undefined);
    });

    test("rejects an unknown code", async () => {
        await assert.rejects(qrService.resolveCode("FRD-" + "0".repeat(32)), /Invalid QR code/);
    });

    test("rejects an expired code", async () => {
        const expired = await prisma.donationCode.create({
            data: {
                donationId,
                code: "FRD-" + "f".repeat(32),
                expiresAt: new Date(Date.now() - 1000),
                createdBy: donor.id,
            },
        });
        await assert.rejects(qrService.resolveCode(expired.code), /expired/);
        await prisma.donationCode.delete({ where: { id: expired.id } });
    });
});
