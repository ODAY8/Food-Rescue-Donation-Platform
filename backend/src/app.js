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

// CORS — explicit allowed origins for foodrescue.cfd, Vercel, and local dev
const STATIC_ALLOWED_ORIGINS = [
    "https://www.foodrescue.cfd",
    "https://foodrescue.cfd",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
];

const envOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map(o => o.trim().replace(/\/+$/, ""))
    .filter(o => o && o !== "*");

const allowedOriginsSet = new Set([...STATIC_ALLOWED_ORIGINS, ...envOrigins]);

const isOriginAllowed = (origin) => {
    if (!origin) return true; // non-browser requests (health checks, curl, mobile)
    if (allowedOriginsSet.has(origin)) return true;
    if (/^https?:\/\/(www\.)?foodrescue\.cfd$/.test(origin)) return true;
    if (origin.endsWith(".vercel.app")) return true;
    if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
    return false;
};

app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy blocked request from ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
    optionsSuccessStatus: 204,
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
