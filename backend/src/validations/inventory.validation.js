const { FOOD_CATEGORIES } = require("./food.validation");

const STORAGE_CONDITIONS = ["ROOM_TEMP", "REFRIGERATED", "FROZEN"];
const PACKAGING_TYPES = ["OPEN", "SEALED", "VACUUM_SEALED", "CANNED"];

const createInventorySchema = {
    name: {
        required: true, minLength: 2, maxLength: 150,
        message: "Item name must be 2–150 characters",
    },
    category: {
        required: false, enum: FOOD_CATEGORIES,
        message: `Category must be one of: ${FOOD_CATEGORIES.join(", ")}`,
    },
    quantity: {
        required: true, type: "number", min: 0,
        message: "Quantity must be a non-negative number",
    },
    unit: {
        required: false, maxLength: 30,
        message: "Unit must be under 30 characters",
    },
    expiryDate: {
        required: true, type: "date",
        message: "Expiry date must be a valid date",
    },
    preparationDate: {
        required: false, type: "date",
        message: "Preparation date must be a valid date",
    },
    storageCondition: {
        required: false, enum: STORAGE_CONDITIONS,
        message: `Storage condition must be one of: ${STORAGE_CONDITIONS.join(", ")}`,
    },
    location: {
        required: false, maxLength: 100,
        message: "Location must be under 100 characters",
    },
};

const updateInventorySchema = Object.fromEntries(
    Object.entries(createInventorySchema).map(([k, v]) => [k, { ...v, required: false }])
);

const adjustInventorySchema = {
    delta: {
        required: true, type: "number",
        message: "Delta must be a number (positive or negative)",
    },
    note: {
        required: false, maxLength: 255,
        message: "Note must be under 255 characters",
    },
};

const donateInventorySchema = {
    quantity: {
        required: true, type: "number", min: 0.01,
        message: "Donation quantity must be a positive number",
    },
    title: {
        required: false, maxLength: 150,
        message: "Title must be under 150 characters",
    },
    description: {
        required: false, maxLength: 1000,
        message: "Description must be under 1000 characters",
    },
    pickupLocation: {
        required: false, maxLength: 255,
        message: "Pickup location must be under 255 characters",
    },
    city: {
        required: false, maxLength: 100,
        message: "City must be under 100 characters",
    },
};

module.exports = {
    createInventorySchema, updateInventorySchema,
    adjustInventorySchema, donateInventorySchema,
    STORAGE_CONDITIONS, PACKAGING_TYPES,
};
