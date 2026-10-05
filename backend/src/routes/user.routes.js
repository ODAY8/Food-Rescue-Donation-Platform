const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, deleteUser } = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOnly, getUserById);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
