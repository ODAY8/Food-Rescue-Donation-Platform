const express = require("express");
const router = express.Router();
const { getPlatformStats, getPublicStats, getMyStats } = require("../controllers/analytics.controller");
const { getV2Stats } = require("../controllers/v2Analytics.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { platformEventSchema } = require("../validations/schedule.validation");
const prisma = require("../config/prisma");

router.get("/public",  getPublicStats);                        // non-sensitive headline counts
router.get("/platform", protect, restrictTo("ADMIN"), getPlatformStats);
router.get("/me",       protect, getMyStats);
router.get("/v2",       protect, restrictTo("ADMIN"), getV2Stats);

// Anonymous-ish client event logging (language changes etc.) — type whitelist enforced.
router.post("/events", protect, validate(platformEventSchema), async (req, res) => {
    try {
        const metadata = req.body.metadata;
        const sanitized = typeof metadata === "object" && metadata !== null
            ? JSON.stringify(metadata).slice(0, 500)
            : null;
        await prisma.platformEvent.create({
            data: {
                type: req.body.type,
                userId: req.user.id,
                metadata: sanitized ? JSON.parse(sanitized) : null,
            },
        });
        res.status(201).json({ success: true, message: "Event logged" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
