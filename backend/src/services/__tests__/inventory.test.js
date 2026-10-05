require("dotenv").config();
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert");
const prisma = require("../../config/prisma");
const inventoryService = require("../inventory.service");

// Integration tests against the dev database. Requires DATABASE_URL + migrated schema.
describe("inventoryService integration", () => {
    let donor;
    let itemId;

    before(async () => {
        donor = await prisma.user.findFirst({ where: { role: "DONOR" } });
        if (!donor) throw new Error("No donor user in DB — run npm run seed first");
    });

    after(async () => {
        if (itemId) {
            await prisma.inventoryTransaction.deleteMany({ where: { itemId } });
            await prisma.inventoryItem.deleteMany({ where: { id: itemId } });
        }
        await prisma.$disconnect();
    });

    test("creates an inventory item with an ADD transaction", async () => {
        const res = await inventoryService.create(donor.id, {
            name: "Test Rice " + Date.now(),
            category: "Prepared",
            quantity: 100,
            unit: "kg",
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            storageCondition: "REFRIGERATED",
            location: "Nairobi",
        });
        itemId = res.data.id;
        assert.strictEqual(res.data.quantity, 100);
        assert.strictEqual(res.data.status, "IN_STOCK");

        const txs = await prisma.inventoryTransaction.findMany({ where: { itemId } });
        assert.strictEqual(txs.length, 1);
        assert.strictEqual(txs[0].type, "ADD");
        assert.strictEqual(txs[0].quantityAfter, 100);
    });

    test("donates 30 of 100 and leaves 70", async () => {
        const res = await inventoryService.donate(itemId, donor.id, 30, { title: "Test Rice Listing" });
        assert.strictEqual(res.data.item.quantity, 70);
        assert.strictEqual(res.data.item.status, "PARTIAL");
        assert.ok(res.data.food.id);

        const txs = await prisma.inventoryTransaction.findMany({
            where: { itemId },
            orderBy: { createdAt: "asc" },
        });
        const donateTx = txs.find((t) => t.type === "DONATE");
        assert.ok(donateTx);
        assert.strictEqual(donateTx.quantityBefore, 100);
        assert.strictEqual(donateTx.quantityAfter, 70);
        assert.strictEqual(donateTx.quantityChange, -30);
    });

    test("prevents donating more than available", async () => {
        await assert.rejects(
            inventoryService.donate(itemId, donor.id, 999),
            /Only 70/
        );
    });

    test("prevents negative quantity via adjust", async () => {
        await assert.rejects(
            inventoryService.adjust(itemId, donor.id, -1000),
            /below zero/
        );
    });

    test("prevents negative quantity at the database level (CHECK constraint)", async () => {
        await assert.rejects(
            prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: -5 } }),
            /inventory_items_quantity_nonnegative|violates check constraint/i
        );
    });

    test("rejects operations on another donor's item", async () => {
        const other = await prisma.user.findFirst({ where: { role: "DONOR", id: { not: donor.id } } });
        if (other) {
            await assert.rejects(inventoryService.donate(itemId, other.id, 10), /Not authorized/);
        }
    });
});
