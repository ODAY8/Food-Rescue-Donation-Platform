require("dotenv").config();
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert");
const prisma = require("../../config/prisma");
const scheduleService = require("../schedule.service");

describe("scheduleService integration", () => {
    let donor;
    let ngo;
    let scheduleId;
    let foodId;

    before(async () => {
        donor = await prisma.user.findFirst({ where: { role: "DONOR" } });
        ngo = await prisma.user.findFirst({ where: { role: "NGO" } });
        if (!donor || !ngo) throw new Error("Seed users missing — run npm run seed");
    });

    after(async () => {
        if (scheduleId) {
            const s = await prisma.scheduledDonation.findUnique({ where: { id: scheduleId } });
            if (s?.donationId) await prisma.donation.deleteMany({ where: { id: s.donationId } });
            await prisma.scheduledDonation.deleteMany({ where: { id: scheduleId } });
        }
        if (foodId) await prisma.food.deleteMany({ where: { id: foodId } });
        await prisma.$disconnect();
    });

    test("creates a valid future schedule", async () => {
        const res = await scheduleService.create(donor.id, {
            title: "Scheduled Soup " + Date.now(),
            description: "Integration test schedule",
            category: "Prepared",
            quantity: 10,
            unit: "servings",
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            city: "Nairobi",
        });
        scheduleId = res.data.id;
        foodId = res.data.food.id;
        assert.ok(scheduleId);
        assert.strictEqual(res.data.status, "SCHEDULED");
    });

    test("rejects a past scheduled date", async () => {
        await assert.rejects(
            scheduleService.create(donor.id, {
                title: "Past Soup",
                scheduledFor: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }),
            /future/
        );
    });

    test("rejects an invalid date", async () => {
        await assert.rejects(
            scheduleService.create(donor.id, { title: "Bad", scheduledFor: "not-a-date", expiryDate: "tomorrow" }),
            /Invalid scheduled date/
        );
    });

    test("NGO accepts the schedule → donation becomes PICKUP_SCHEDULED", async () => {
        const res = await scheduleService.accept(scheduleId, ngo.id);
        assert.strictEqual(res.data.donation.status, "PICKUP_SCHEDULED");
        assert.strictEqual(res.data.schedule.status, "CLAIMED");
    });

    test("cancels an open schedule and restores food to AVAILABLE", async () => {
        const res = await scheduleService.create(donor.id, {
            title: "Cancel Me " + Date.now(),
            category: "Bakery",
            quantity: 5,
            unit: "loaves",
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        });
        const toCancel = res.data.id;
        const cancelRes = await scheduleService.cancel(toCancel, donor.id);
        assert.strictEqual(cancelRes.data.status, "CANCELLED");
        const food = await prisma.food.findUnique({ where: { id: res.data.food.id } });
        assert.strictEqual(food.status, "AVAILABLE");
        await prisma.scheduledDonation.deleteMany({ where: { id: toCancel } });
        await prisma.food.deleteMany({ where: { id: res.data.food.id } });
    });

    test("NGO cannot accept an already-accepted schedule", async () => {
        await assert.rejects(scheduleService.accept(scheduleId, ngo.id), /no longer open/);
    });
});
