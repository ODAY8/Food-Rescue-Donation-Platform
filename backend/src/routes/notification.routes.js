const express = require("express");
const router = express.Router();
const { getMyNotifications, markRead, markAllRead, deleteNotification } = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/",              protect, getMyNotifications);
router.patch("/:id/read",   protect, markRead);
router.patch("/read-all",   protect, markAllRead);
router.delete("/:id",       protect, deleteNotification);

module.exports = router;
