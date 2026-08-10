const NotificationModel = require("../models/notification.model");

// Internal helper — called by other services, not a route handler
const push = (userId, title, message, type = "info", link = null) =>
    NotificationModel.create({ userId, title, message, type, link }).catch(err =>
        console.error("Failed to create notification:", err.message)
    );

const getMyNotifications = async (userId, query = {}) => {
    const unreadOnly = query.unread === "true";
    const notifications = await NotificationModel.findByUserId(userId, { unreadOnly });
    const unreadCount = await NotificationModel.countUnread(userId);
    return { success: true, data: notifications, unreadCount };
};

const markRead = async (id, userId) => {
    const n = await NotificationModel.markRead(id, userId);
    if (!n) throw new Error("Notification not found");
    return { success: true, data: n };
};

const markAllRead = async (userId) => {
    await NotificationModel.markAllRead(userId);
    return { success: true, message: "All notifications marked as read" };
};

const deleteNotification = async (id, userId) => {
    await NotificationModel.delete(id, userId);
    return { success: true, message: "Notification deleted" };
};

module.exports = { push, getMyNotifications, markRead, markAllRead, deleteNotification };
