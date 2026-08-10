const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

// adminOnly — shorthand for restrictTo("ADMIN")
const adminOnly = (req, res, next) => restrictTo("ADMIN")(req, res, next);

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        const message = err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token";
        res.status(401).json({ success: false, message });
    }
};

/**
 * restrictTo(...roles) — role-based access guard, must come after protect.
 * Roles are canonical Prisma enum values: DONOR, NGO, ADMIN (case-insensitive).
 */
const restrictTo = (...roles) => (req, res, next) => {
    const normalized = roles.map((r) => r.toUpperCase());
    if (!normalized.includes(String(req.user?.role || "").toUpperCase())) {
        return res.status(403).json({
            success: false,
            message: `Access denied. Required role: ${roles.join(" or ")}`,
        });
    }
    next();
};

module.exports = { protect, restrictTo, adminOnly };
