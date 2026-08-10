const prisma = require("../config/prisma");

const DonationCodeModel = {
    create: (data) =>
        prisma.donationCode.create({
            data: {
                donationId: data.donationId,
                code: data.code,
                expiresAt: data.expiresAt || null,
                createdBy: data.createdBy,
            },
        }),

    findByDonationId: (donationId) =>
        prisma.donationCode.findFirst({ where: { donationId } }),

    findByCode: (code) =>
        prisma.donationCode.findUnique({ where: { code } }),

    update: (id, data) =>
        prisma.donationCode.update({
            where: { id },
            data: {
                ...(data.code !== undefined && { code: data.code }),
                ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
                ...(data.createdBy !== undefined && { createdBy: data.createdBy }),
            },
        }),

    recordScan: (id) =>
        prisma.donationCode.update({
            where: { id },
            data: {
                scansCount: { increment: 1 },
                lastScannedAt: new Date(),
            },
        }),
};

module.exports = DonationCodeModel;
