const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getProfile, updateProfile, logoutUser } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { registerSchema, loginSchema, updateProfileSchema } = require("../validations/auth.validation");

// Public routes
router.post("/register", validate(registerSchema), registerUser);
router.post("/login",    validate(loginSchema),    loginUser);

// Protected routes — require valid JWT
router.get("/profile",  protect, getProfile);
router.put("/profile",  protect, validate(updateProfileSchema), updateProfile);
router.post("/logout",  protect, logoutUser);

module.exports = router;
