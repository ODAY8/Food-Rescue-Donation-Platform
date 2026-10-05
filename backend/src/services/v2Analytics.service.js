const prisma = require("../config/prisma");

// Version 2.0 admin analytics: AI usage, inventory, schedules, QR activity,
// expiry trends, search/language events. Aggregates only — no PII beyond
// what the existing admin views already expose.
const getV2Stats = async () => {
    const now = new Date();

    const [
        predictions,
        inventoryItems,
        inventoryExpiring,
        schedules,
        qrStats,
        expiryTrends,
        searchEvents,
        languageEvents,
    ] = await Promise.all([
        // AI prediction usage
        prisma.expiryPrediction.groupBy({
            by: ["urgency", "model"],
            _count: { _all: true },
            _avg: { riskScore: true },
        }),
        // Inventory statistics
        prisma.inventoryItem.groupBy({
            by: ["status"],
            _count: { _all: true },
            _sum: { quantity: true },
        }),
        // Expiring-soon inventory (next 48h)
        prisma.inventoryItem.count({
            where: { status: "IN_STOCK", expiryDate: { lte: new Date(now.getTime() + 48 * 60 * 60 * 1000) } },
        }),
        // Scheduled donations by status
        prisma.scheduledDonation.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),
        // QR activity
        prisma.donationCode.aggregate({
            _count: { _all: true },
            _sum: { scansCount: true },
        }),
        // Expiry trends: foods expired by category (all-time)
        prisma.food.groupBy({
            by: ["category"],
            where: { status: "EXPIRED" },
            _count: { _all: true },
        }),
        // Search event counts
        prisma.platformEvent.groupBy({
            by: ["type"],
            where: { type: "SEARCH" },
            _count: { _all: true },
        }),
        // Language usage
        prisma.platformEvent.groupBy({
            by: ["type"],
            where: { type: "LANGUAGE_CHANGE" },
            _count: { _all: true },
        }),
    ]);

    return {
        success: true,
        data: {
            predictions: {
                byUrgency: predictions.filter((p) => !p.model).map((p) => ({ urgency: p.urgency, count: p._count._all, avgRisk: Math.round(p._avg.riskScore || 0) })),
                byModel: predictions
                    .filter((p) => p.model)
                    .map((p) => ({ model: p.model, count: p._count._all })),
                total: predictions.reduce((s, p) => s + p._count._all, 0),
            },
            inventory: {
                byStatus: inventoryItems.map((i) => ({ status: i.status, count: i._count._all, totalQty: i._sum.quantity })),
                expiringSoon: inventoryExpiring,
            },
            schedules: {
                byStatus: schedules.map((s) => ({ status: s.status, count: s._count._all })),
                total: schedules.reduce((s, x) => s + x._count._all, 0),
            },
            qr: {
                totalCodes: qrStats._count._all,
                totalScans: qrStats._sum.scansCount || 0,
            },
            expiryTrends: expiryTrends.map((e) => ({ category: e.category, count: e._count._all })),
            events: {
                searchCount: searchEvents.reduce((s, e) => s + e._count._all, 0),
                languageCount: languageEvents.reduce((s, e) => s + e._count._all, 0),
            },
        },
    };
};

module.exports = { getV2Stats };
