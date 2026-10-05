const notifService = require("../services/notification.service");

const getMyNotifications = async (req, res) => {
    try {
        const result = await notifService.getMyNotifications(req.user.id, req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const markRead = async (req, res) => {
    try {
        const result = await notifService.markRead(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const markAllRead = async (req, res) => {
    try {
        const result = await notifService.markAllRead(req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const result = await notifService.deleteNotification(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getMyNotifications, markRead, markAllRead, deleteNotification };
