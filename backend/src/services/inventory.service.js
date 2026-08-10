const prisma = require("../config/prisma");
const FoodModel = require("../models/food.model");

const INVENTORY_STATUSES = ["IN_STOCK", "PARTIAL", "DONATED", "EXPIRED", "REMOVED"];

const list = async (userId, query = {}) => {
    const { status, category, search, page = 1, limit = 20 } = query;
    const where = {
        donorId: userId,
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const skip = (p - 1) * l;

    const [data, total] = await Promise.all([
        prisma.inventoryItem.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: l }),
        prisma.inventoryItem.count({ where }),
    ]);
    return { success: true, data, pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) } };
};

const getById = async (id, userId) => {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error("Inventory item not found");
    if (item.donorId !== userId) throw new Error("Not authorized to view this inventory item");
    return { success: true, data: item };
};

const create = async (userId, body) => {
    const item = await prisma.inventoryItem.create({
        data: {
            donorId: userId,
            name: body.name,
            category: body.category || "Other",
            quantity: parseFloat(body.quantity),
            unit: body.unit || "kg",
            preparationDate: body.preparationDate ? new Date(body.preparationDate) : null,
            expiryDate: new Date(body.expiryDate),
            storageCondition: body.storageCondition || null,
            location: body.location || "",
        },
    });
    // Initial ADD transaction.
    await prisma.inventoryTransaction.create({
        data: {
            itemId: item.id,
            type: "ADD",
            quantityChange: parseFloat(body.quantity),
            quantityBefore: 0,
            quantityAfter: parseFloat(body.quantity),
        },
    });
    return { success: true, data: item };
};

const update = async (id, userId, body) => {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error("Inventory item not found");
    if (item.donorId !== userId) throw new Error("Not authorized to update this inventory item");

    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.category !== undefined) data.category = body.category;
    if (body.quantity !== undefined) data.quantity = parseFloat(body.quantity);
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.preparationDate !== undefined) data.preparationDate = body.preparationDate ? new Date(body.preparationDate) : null;
    if (body.expiryDate !== undefined) data.expiryDate = new Date(body.expiryDate);
    if (body.storageCondition !== undefined) data.storageCondition = body.storageCondition || null;
    if (body.location !== undefined) data.location = body.location;

    const updated = await prisma.inventoryItem.update({ where: { id }, data });
    return { success: true, data: updated };
};

// Soft-remove an item. Records a REMOVE transaction for any remaining qty.
const remove = async (id, userId) => {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error("Inventory item not found");
    if (item.donorId !== userId) throw new Error("Not authorized to delete this inventory item");
    if (item.status === "REMOVED" || item.status === "DONATED") {
        throw new Error("This item has already been removed or donated");
    }

    await prisma.$transaction([
        prisma.inventoryItem.update({ where: { id }, data: { status: "REMOVED" } }),
        prisma.inventoryTransaction.create({
            data: {
                itemId: id,
                type: "REMOVE",
                quantityChange: -item.quantity,
                quantityBefore: item.quantity,
                quantityAfter: 0,
                note: "Item removed",
            },
        }),
    ]);
    return { success: true, message: "Inventory item removed" };
};

const history = async (userId, query = {}) => {
    const { page = 1, limit = 20 } = query;
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit) || 20));

    const items = await prisma.inventoryItem.findMany({
        where: { donorId: userId },
        select: { id: true },
    });
    const ids = items.map((i) => i.id);

    const [data, total] = await Promise.all([
        prisma.inventoryTransaction.findMany({
            where: { itemId: { in: ids } },
            include: { item: { select: { id: true, name: true, unit: true } } },
            orderBy: { createdAt: "desc" },
            skip: (p - 1) * l,
            take: l,
        }),
        prisma.inventoryTransaction.count({ where: { itemId: { in: ids } } }),
    ]);
    return { success: true, data, pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) } };
};

// Adjust quantity by a signed delta (positive = add, negative = reduce).
const adjust = async (id, userId, delta, note) => {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error("Inventory item not found");
    if (item.donorId !== userId) throw new Error("Not authorized to adjust this inventory item");
    if (item.status === "REMOVED" || item.status === "DONATED") throw new Error("This item is no longer active");

    const change = parseFloat(delta);
    if (!Number.isFinite(change) || change === 0) throw new Error("Adjustment must be a non-zero number");
    const quantityAfter = item.quantity + change;
    if (quantityAfter < 0) throw new Error("Quantity cannot go below zero");

    const updated = await prisma.$transaction(async (tx) => {
        // Row lock via update to avoid races.
        const locked = await tx.inventoryItem.update({
            where: { id },
            data: { quantity: quantityAfter, status: quantityAfter === 0 ? "DONATED" : "PARTIAL" },
        });
        await tx.inventoryTransaction.create({
            data: {
                itemId: id,
                type: "ADJUST",
                quantityChange: change,
                quantityBefore: item.quantity,
                quantityAfter,
                note: note || null,
            },
        });
        return locked;
    });

    return { success: true, data: updated };
};

// Donate a quantity: reduces inventory AND creates a real V1 food listing.
const donate = async (id, userId, qty, extra = {}) => {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error("Inventory item not found");
    if (item.donorId !== userId) throw new Error("Not authorized to donate from this inventory item");
    if (item.status === "REMOVED" || item.status === "DONATED") throw new Error("This item is no longer active");

    const quantity = parseFloat(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Donation quantity must be positive");
    if (quantity > item.quantity) throw new Error(`Only ${item.quantity} ${item.unit} available`);

    const quantityAfter = item.quantity - quantity;
    const result = await prisma.$transaction(async (tx) => {
        const locked = await tx.inventoryItem.update({
            where: { id },
            data: { quantity: quantityAfter, status: quantityAfter === 0 ? "DONATED" : "PARTIAL" },
        });
        const food = await tx.food.create({
            data: {
                donorId: userId,
                title: extra.title || item.name,
                description: extra.description || `Surplus ${item.name.toLowerCase()} donated from inventory.`,
                category: item.category,
                quantity: Math.round(quantity),
                unit: item.unit,
                servings: extra.servings ? parseInt(extra.servings) : Math.round(quantity),
                expiryDate: item.expiryDate,
                pickupLocation: extra.pickupLocation || "",
                pickupWindow: extra.pickupWindow || "",
                city: extra.city || item.location || "",
                latitude: extra.latitude ? parseFloat(extra.latitude) : null,
                longitude: extra.longitude ? parseFloat(extra.longitude) : null,
                preparationDate: item.preparationDate,
                storageCondition: item.storageCondition,
            },
        });
        await tx.inventoryTransaction.create({
            data: {
                itemId: id,
                type: "DONATE",
                quantityChange: -quantity,
                quantityBefore: item.quantity,
                quantityAfter,
                note: `Donated ${quantity} ${item.unit}`,
                foodId: food.id,
            },
        });
        return { item: locked, food };
    });

    return { success: true, data: result };
};

// Mark an item EXPIRED (e.g. after the daily sweep or manually).
const markExpired = async (id, userId) => {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new Error("Inventory item not found");
    if (item.donorId !== userId) throw new Error("Not authorized");
    if (item.status === "REMOVED" || item.status === "DONATED") throw new Error("This item is no longer active");

    await prisma.$transaction([
        prisma.inventoryItem.update({ where: { id }, data: { status: "EXPIRED" } }),
        prisma.inventoryTransaction.create({
            data: {
                itemId: id,
                type: "EXPIRE",
                quantityChange: -item.quantity,
                quantityBefore: item.quantity,
                quantityAfter: 0,
                note: "Marked as expired",
            },
        }),
    ]);
    return { success: true, message: "Inventory item marked as expired" };
};

module.exports = {
    list, getById, create, update, remove, history, adjust, donate, markExpired, INVENTORY_STATUSES,
};
