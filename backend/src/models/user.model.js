const prisma = require("../config/prisma");

const SAFE_SELECT = {
    id: true, name: true, email: true, role: true,
    phone: true, address: true, organization: true,
    createdAt: true, updatedAt: true,
};

const UserModel = {
    findByEmail: (email) =>
        prisma.user.findUnique({ where: { email } }),

    findById: (id) =>
        prisma.user.findUnique({ where: { id }, select: SAFE_SELECT }),

    create: ({ name, email, password, organization = null, phone = null, role = "DONOR" }) =>
        prisma.user.create({
            data: { name, email, password, organization, phone, role },
            select: { id: true, name: true, email: true, role: true, organization: true, createdAt: true },
        }),

    update: (id, fields) => {
        const allowed = ["name", "email", "organization", "phone", "address"];
        const data = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
        return prisma.user.update({ where: { id }, data, select: SAFE_SELECT });
    },

    findAll: ({ role, search } = {}) =>
        prisma.user.findMany({
            where: {
                ...(role ? { role } : {}),
                ...(search ? { OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { organization: { contains: search, mode: "insensitive" } },
                ]} : {}),
            },
            select: {
                id: true, name: true, email: true, role: true,
                organization: true, phone: true, createdAt: true,
                _count: { select: { foods: true, donationsDonated: true, donationsReceived: true } },
            },
            orderBy: { createdAt: "desc" },
        }),

    findByIdWithDetails: (id) =>
        prisma.user.findUnique({
            where: { id },
            select: {
                ...SAFE_SELECT,
                _count: { select: { foods: true, donationsDonated: true, donationsReceived: true } },
            },
        }),

    delete: (id) => prisma.user.delete({ where: { id } }),
};

module.exports = UserModel;
