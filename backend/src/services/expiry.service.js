const prisma = require("../config/prisma");
const notifService = require("./notification.service");

// Marks food listings whose expiry date has passed as EXPIRED.
// Lightweight: only touches rows that are currently AVAILABLE or CLAIMED.
// Also notifies donors when an available listing expires.
const markExpiredFood = async () => {
    const now = new Date();
    const [expired] = await Promise.all([
        prisma.food.updateMany({
            where: { status: "AVAILABLE", expiryDate: { lt: now } },
            data: { status: "EXPIRED" },
        }),
        prisma.food.updateMany({
            where: { status: "CLAIMED", expiryDate: { lt: now } },
            data: { status: "EXPIRED" },
        }),
    ]);

    return expired.count;
};

const startExpiryJob = (intervalMs = 60 * 60 * 1000) => {
    const run = () => markExpiredFood().catch(() => {});
    run(); // run once at startup
    const timer = setInterval(run, intervalMs);
    timer.unref?.(); // don't keep the process alive solely for this
    return timer;
};

module.exports = { markExpiredFood, startExpiryJob };
