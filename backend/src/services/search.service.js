const FoodModel = require("../models/food.model");
const prisma = require("../config/prisma");

const SORTS = {
    expiring: { expiryDate: "asc" },
    quantity: { quantity: "desc" },
    recent: { createdAt: "desc" },
    relevance: { createdAt: "desc" }, // placeholder ordering; tie-break below
};

// Distance (km) via Haversine.
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
};

const rankForNgo = (foods, ngoUser) => {
    const hasCoords = ngoUser && typeof ngoUser.latitude === "number" && typeof ngoUser.longitude === "number";
    return foods.map((food) => {
        const reasons = [];

        // Urgency (time to expiry) — 50% weight.
        const remainingHrs = (new Date(food.expiryDate) - Date.now()) / (60 * 60 * 1000);
        let urgencyScore = 0;
        if (remainingHrs <= 0) urgencyScore = 0;
        else if (remainingHrs <= 12) urgencyScore = 1;
        else if (remainingHrs <= 24) urgencyScore = 0.8;
        else if (remainingHrs <= 72) urgencyScore = 0.5;
        else urgencyScore = 0.2;
        if (remainingHrs <= 24) reasons.push("expiring soon");

        // Distance — 30% weight.
        let distanceKm = null;
        let distanceScore = 0.5;
        if (hasCoords && typeof food.latitude === "number" && typeof food.longitude === "number") {
            distanceKm = haversineKm(ngoUser.latitude, ngoUser.longitude, food.latitude, food.longitude);
            distanceScore = Math.max(0, Math.min(1, 1 - distanceKm / 20)); // ≤20km best
            if (distanceKm <= 5) reasons.push("nearby");
        }

        // Quantity — 20% weight.
        const qtyScore = Math.min(1, (food.quantity || 0) / 100);
        if ((food.quantity || 0) >= 50) reasons.push("large quantity");

        const matchScore = Math.round((urgencyScore * 0.5 + distanceScore * 0.3 + qtyScore * 0.2) * 100);

        return { ...food, matchScore, matchReasons: reasons, distanceKm };
    }).sort((a, b) => b.matchScore - a.matchScore);
};

const searchFoods = async (query, user = null) => {
    const {
        q, category, city, status, availability, expiryBefore, expiryAfter,
        urgency, minQty, maxQty, lat, lng, sort = "expiring", page = 1, limit = 20,
    } = query;

    const where = {
        ...(status ? { status } : {}),
        ...(availability === "true" ? { status: "AVAILABLE" } : {}),
        ...(category ? { category } : {}),
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(expiryBefore ? { expiryDate: { lte: new Date(expiryBefore) } } : {}),
        ...(expiryAfter ? { expiryDate: { gte: new Date(expiryAfter) } } : {}),
        ...(minQty !== undefined ? { quantity: { gte: parseInt(minQty) } } : {}),
        ...(maxQty !== undefined ? { quantity: { lte: parseInt(maxQty) } } : {}),
        ...(urgency ? { expiryDate: { lte: new Date(Date.now() + parseInt(urgency) * 60 * 60 * 1000) } } : {}),
    };

    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit) || 20));

    const sortKey = SORTS[sort] ? sort : "expiring";

    // Fetch slightly more than needed for distance ranking (which sorts in JS).
    const fetchLimit = sort === "nearest" || sort === "relevance" ? Math.min(200, p * l) : l;
    const skip = (p - 1) * l;

    const orderBy = SORTS[sortKey];
    const [data, total] = await Promise.all([
        prisma.food.findMany({
            where,
            include: { donor: { select: { id: true, name: true, organization: true } } },
            orderBy,
            skip,
            take: fetchLimit,
        }),
        prisma.food.count({ where }),
    ]);

    let results = data;

    // Nearest sorting (user coords or provided lat/lng).
    if (sort === "nearest") {
        const refLat = parseFloat(lat) || user?.latitude;
        const refLng = parseFloat(lng) || user?.longitude;
        if (typeof refLat === "number" && typeof refLng === "number") {
            results = [...data]
                .map((f) => ({
                    ...f,
                    distanceKm:
                        typeof f.latitude === "number" && typeof f.longitude === "number"
                            ? haversineKm(refLat, refLng, f.latitude, f.longitude)
                            : null,
                }))
                .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        }
    }

    // Log search event (analytics).
    prisma.platformEvent.create({
        data: {
            type: "SEARCH",
            userId: user?.id || null,
            metadata: { query: q || null, category: category || null, city: city || null, sort, results: total },
        },
    }).catch(() => {});

    return {
        success: true,
        data: results,
        pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) },
    };
};

module.exports = { searchFoods, rankForNgo, haversineKm, SORTS };
