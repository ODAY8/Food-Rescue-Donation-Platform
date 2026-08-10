require("./config/env"); // validates env vars on startup

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const routes = require("./routes");
const { notFound } = require("./middleware/notFound.middleware");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

// Security headers — allow cross-origin resource policy for uploaded images
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS — only allow the configured frontend origin
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));

// General API rate limit
app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
}));

// Stricter limit on auth endpoints (brute-force protection)
app.use("/api/auth", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts, please try again later." },
}));

app.use(express.json({ limit: "10kb" })); // guard against large payloads
app.use(express.urlencoded({ extended: false }));

// Static food images (uploaded to local disk). Not publicly browsable
// (dotfiles denied) and served with no-sniff headers.
const { ABS_UPLOAD_DIR } = require("./config/multer");
app.use(
    "/uploads",
    express.static(ABS_UPLOAD_DIR, {
        dotfiles: "deny",
        index: false,
        setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    })
);

app.use("/", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
