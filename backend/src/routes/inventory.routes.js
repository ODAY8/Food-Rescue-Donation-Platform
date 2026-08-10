const express = require("express");
const router = express.Router();
const {
    listItems, getItem, createItem, updateItem, removeItem,
    adjustItem, donateFromInventory, getHistory, markExpired,
} = require("../controllers/inventory.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
    createInventorySchema, updateInventorySchema,
    adjustInventorySchema, donateInventorySchema,
} = require("../validations/inventory.validation");

// All inventory endpoints are donor-only.
router.use(protect, restrictTo("DONOR"));

router.get("/",                listItems);
router.get("/history",         getHistory);
router.post("/",               validate(createInventorySchema), createItem);
router.get("/:id",             getItem);
router.put("/:id",             validate(updateInventorySchema), updateItem);
router.delete("/:id",          removeItem);
router.post("/:id/adjust",     validate(adjustInventorySchema), adjustItem);
router.post("/:id/donate",     validate(donateInventorySchema), donateFromInventory);
router.post("/:id/expired",    markExpired);

module.exports = router;
