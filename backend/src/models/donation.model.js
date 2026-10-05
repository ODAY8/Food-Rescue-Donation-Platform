const prisma = require("../config/prisma");

const FOOD_SELECT = {
    id: true, title: true, description: true, category: true,
    quantity: true, unit: true, servings: true, expiryDate: true,
    pickupLocation: true, pickupWindow: true, city: true, imageUrl: true, status: true,
    donor: { select: { id: true, name: true, email: true, organization: true } },
};

const NGO_SELECT = { id: true, name: true, email: true, organization: true };

const DonationModel = {
    create: (foodId, ngoId, donorId) =>
        prisma.donation.create({
            data: { foodId, ngoId, donorId },
            include: { food: { select: FOOD_SELECT }, ngo: { select: NGO_SELECT } },
        }),

    findByDonorId: (donorId) =>
        prisma.donation.findMany({
            where: { donorId },
            include: {
                food: { select: FOOD_SELECT },
                ngo: { select: NGO_SELECT },
            },
            orderBy: { createdAt: "desc" },
        }),

    findByNgoId: (ngoId) =>
        prisma.donation.findMany({
            where: { ngoId },
            include: { food: { select: FOOD_SELECT } },
            orderBy: { createdAt: "desc" },
        }),

    findById: (id) =>
        prisma.donation.findUnique({
            where: { id },
            include: {
                food: { select: FOOD_SELECT },
                ngo: { select: NGO_SELECT },
            },
        }),

    findAll: ({ status, page = 1, limit = 20 } = {}) => {
        const where = status ? { status } : {};
        const skip = (parseInt(page) - 1) * parseInt(limit);
        return Promise.all([
            prisma.donation.findMany({
                where,
                include: {
                    food: { select: FOOD_SELECT },
                    donor: { select: NGO_SELECT },
                    ngo: { select: NGO_SELECT },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: parseInt(limit),
            }),
            prisma.donation.count({ where }),
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

    updateStatus: (id, status, timestamps = {}) =>
        prisma.donation.update({
            where: { id },
            data: { status, ...timestamps },
            include: { food: { select: FOOD_SELECT }, ngo: { select: NGO_SELECT } },
        }),
};

module.exports = DonationModel;
