const prisma = require("../config/prisma");

const getPlatformStats = async () => {
    const [foodStats, donationStats, userStats, topDonors, byCategory, byMonth] = await Promise.all([
        prisma.food.aggregate({
            _count: { id: true },
            _sum: { servings: true },
        }),
        prisma.donation.groupBy({
            by: ["status"],
            _count: { id: true },
        }),
        prisma.user.groupBy({
            by: ["role"],
            _count: { id: true },
        }),
        prisma.user.findMany({
            where: { role: "DONOR" },
            select: {
                id: true, name: true, organization: true,
                _count: { select: { foods: true } },
                foods: { select: { servings: true } },
            },
            orderBy: { foods: { _count: "desc" } },
            take: 5,
        }),
        prisma.food.groupBy({
            by: ["category"],
            _count: { id: true },
            _sum: { servings: true },
        }),
        prisma.$queryRaw`
            SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
                   COUNT(*)::int AS listings,
                   COALESCE(SUM(servings), 0)::int AS servings
            FROM foods
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY month
            ORDER BY month ASC
        `,
    ]);

    const donationMap = Object.fromEntries(donationStats.map(d => [d.status, d._count.id]));
    const userMap = Object.fromEntries(userStats.map(u => [u.role, u._count.id]));

    const foodStatusCounts = await prisma.food.groupBy({
        by: ["status"],
        _count: { id: true },
    });
    const foodStatusMap = Object.fromEntries(foodStatusCounts.map(f => [f.status, f._count.id]));

    return {
        success: true,
        data: {
            foods: {
                total_listings: foodStats._count.id,
                total_servings: foodStats._sum.servings || 0,
                available: foodStatusMap.AVAILABLE || 0,
                claimed:   foodStatusMap.CLAIMED   || 0,
                expired:   foodStatusMap.EXPIRED   || 0,
            },
            donations: {
                total_donations: Object.values(donationMap).reduce((a, b) => a + b, 0),
                completed: donationMap.COMPLETED || 0,
                pending:   donationMap.PENDING   || 0,
                cancelled: donationMap.CANCELLED || 0,
                approved:  donationMap.APPROVED  || 0,
                collected: donationMap.COLLECTED || 0,
                delivered: donationMap.DELIVERED || 0,
            },
            users: {
                total_users: Object.values(userMap).reduce((a, b) => a + b, 0),
                donors:     userMap.DONOR || 0,
                ngos:       userMap.NGO   || 0,
                admins:     userMap.ADMIN || 0,
            },
            topDonors: topDonors.map(u => ({
                id: u.id,
                name: u.name,
                organization: u.organization,
                listings_count: u._count.foods,
                meals_donated: u.foods.reduce((s, f) => s + (f.servings || 0), 0),
            })),
            byCategory: byCategory.map(c => ({
                category: c.category,
                count: c._count.id,
                servings: c._sum.servings || 0,
            })),
            byMonth,
        },
    };
};

// Public-facing headline stats (non-sensitive aggregate counts only)
const getPublicStats = async () => {
    const [foods, users, completedDonations, totalServings] = await Promise.all([
        prisma.food.count(),
        prisma.user.count(),
        prisma.donation.count({ where: { status: "COMPLETED" } }),
        prisma.food.aggregate({ _sum: { servings: true } }),
    ]);

    return {
        success: true,
        data: {
            total_listings: foods,
            total_users: users,
            completed_donations: completedDonations,
            total_servings: totalServings._sum.servings || 0,
        },
    };
};

const getMyStats = async (userId) => {
    const [donated, claimed] = await Promise.all([
        prisma.food.aggregate({
            where: { donorId: userId },
            _count: { id: true },
            _sum: { servings: true },
        }),
        prisma.donation.aggregate({
            where: { ngoId: userId },
            _count: { id: true },
        }),
    ]);

    const [donatedByStatus, claimedCompleted, mealsReceived] = await Promise.all([
        prisma.food.groupBy({ by: ["status"], where: { donorId: userId }, _count: { id: true } }),
        prisma.donation.count({ where: { ngoId: userId, status: "COMPLETED" } }),
        prisma.donation.findMany({
            where: { ngoId: userId },
            include: { food: { select: { servings: true } } },
        }),
    ]);

    const statusMap = Object.fromEntries(donatedByStatus.map(s => [s.status, s._count.id]));

    return {
        success: true,
        data: {
            donated: {
                listings: donated._count.id,
                meals: donated._sum.servings || 0,
                active:  statusMap.AVAILABLE || 0,
                claimed: statusMap.CLAIMED   || 0,
                expired: statusMap.EXPIRED   || 0,
            },
            claimed: {
                total_claims: claimed._count.id,
                completed: claimedCompleted,
                meals_received: mealsReceived.reduce((s, d) => s + (d.food?.servings || 0), 0),
            },
        },
    };
};

module.exports = { getPlatformStats, getPublicStats, getMyStats };
