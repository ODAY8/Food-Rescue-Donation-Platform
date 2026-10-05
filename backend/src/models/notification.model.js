const prisma = require("../config/prisma");

// Map lowercase type strings to Prisma enum values
const TYPE_MAP = { info: "INFO", success: "SUCCESS", warning: "WARNING", action: "ACTION" };

const NotificationModel = {
    create: ({ userId, title, message, type = "info", link = null }) =>
        prisma.notification.create({
            data: { userId, title, message, type: TYPE_MAP[type] || "INFO", link },
        }),

    findByUserId: (userId, { limit = 30, unreadOnly = false } = {}) =>
        prisma.notification.findMany({
            where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
            orderBy: { createdAt: "desc" },
            take: limit,
        }),

    countUnread: (userId) =>
        prisma.notification.count({ where: { userId, isRead: false } }),

    markRead: (id, userId) =>
        prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        }).then(() => prisma.notification.findUnique({ where: { id } })),

    markAllRead: (userId) =>
        prisma.notification.updateMany({ where: { userId }, data: { isRead: true } }),

    delete: (id, userId) =>
        prisma.notification.deleteMany({ where: { id, userId } }),
};

module.exports = NotificationModel;
