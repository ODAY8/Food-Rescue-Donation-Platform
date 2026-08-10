const prisma = require("../config/prisma");

const DONOR_SELECT = {
    id: true, name: true, email: true, organization: true,
};

const FoodModel = {
    create: (data, donorId) =>
        prisma.food.create({
            data: {
                donorId,
                title:          data.title,
                description:    data.description,
                category:       data.category || "Other",
                quantity:       parseInt(data.quantity),
                unit:           data.unit || "kg",
                servings:       parseInt(data.servings) || 0,
                expiryDate:     new Date(data.expiryDate),
                pickupLocation: data.pickupLocation || data.pickupAddress || "",
                pickupWindow:   data.pickupWindow || "",
                city:           data.city || "",
                latitude:       data.latitude ? parseFloat(data.latitude) : null,
                longitude:      data.longitude ? parseFloat(data.longitude) : null,
                imageUrl:       data.imageUrl || "",
                // V2 prediction inputs (optional; V1 behavior unchanged)
                preparationDate: data.preparationDate ? new Date(data.preparationDate) : null,
                storageCondition: data.storageCondition || null,
                packaging:       data.packaging || null,
                temperature:     data.temperature !== undefined && data.temperature !== null && data.temperature !== "" ? parseFloat(data.temperature) : null,
            },
            include: { donor: { select: DONOR_SELECT } },
        }),

    findAll: ({ status, search, category, city, unit, expiryBefore, expiryAfter, page = 1, limit = 20 } = {}) => {
        const where = {
            ...(status   ? { status }                                                    : {}),
            ...(search   ? { title: { contains: search, mode: "insensitive" } }          : {}),
            ...(category ? { category }                                                  : {}),
            ...(city     ? { city: { contains: city, mode: "insensitive" } }             : {}),
            ...(unit     ? { unit: { contains: unit, mode: "insensitive" } }             : {}),
            ...(expiryBefore ? { expiryDate: { lte: new Date(expiryBefore) } }           : {}),
            ...(expiryAfter  ? { expiryDate: { gte: new Date(expiryAfter) } }            : {}),
        };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        return Promise.all([
            prisma.food.findMany({
                where,
                include: { donor: { select: DONOR_SELECT } },
                orderBy: { expiryDate: "asc" },
                skip,
                take: parseInt(limit),
            }),
            prisma.food.count({ where }),
        ]).then(([data, total]) => ({
            data,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }));
    },

    findById: (id) =>
        prisma.food.findUnique({
            where: { id },
            include: {
                donor: { select: DONOR_SELECT },
                donations: {
                    select: { id: true, status: true, ngoId: true, requestedAt: true },
                    orderBy: { requestedAt: "desc" },
                    take: 1,
                },
            },
        }),

    findByDonorId: (donorId) =>
        prisma.food.findMany({
            where: { donorId },
            include: {
                donor: { select: DONOR_SELECT },
                _count: { select: { donations: true } },
            },
            orderBy: { createdAt: "desc" },
        }),

    update: (id, data) => {
        const allowed = {
            title: true, description: true, category: true, quantity: true,
            unit: true, servings: true, expiryDate: true, pickupLocation: true,
            pickupWindow: true, city: true, latitude: true, longitude: true,
            imageUrl: true, status: true,
            preparationDate: true, storageCondition: true, packaging: true, temperature: true,
        };
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([k]) => allowed[k])
        );
        if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
        if (updateData.quantity)   updateData.quantity   = parseInt(updateData.quantity);
        if (updateData.servings)   updateData.servings   = parseInt(updateData.servings);
        if (updateData.latitude)   updateData.latitude   = parseFloat(updateData.latitude);
        if (updateData.longitude)  updateData.longitude  = parseFloat(updateData.longitude);
        if (updateData.preparationDate) updateData.preparationDate = new Date(updateData.preparationDate);
        if (updateData.temperature !== undefined && updateData.temperature !== null && updateData.temperature !== "")
            updateData.temperature = parseFloat(updateData.temperature);
        return prisma.food.update({
            where: { id },
            data: updateData,
            include: { donor: { select: DONOR_SELECT } },
        });
    },

    delete: (id) =>
        prisma.food.delete({ where: { id } }),
};

module.exports = FoodModel;
