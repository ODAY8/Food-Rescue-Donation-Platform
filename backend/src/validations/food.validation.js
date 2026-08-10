const FOOD_CATEGORIES = ["Produce", "Dairy", "Bakery", "Meat", "Prepared", "Beverages", "Pantry", "Other"];
const STORAGE_CONDITIONS = ["ROOM_TEMP", "REFRIGERATED", "FROZEN"];
const PACKAGING_TYPES = ["OPEN", "SEALED", "VACUUM_SEALED", "CANNED"];

const createFoodSchema = {
    title: {
        required: true, minLength: 3, maxLength: 150,
        message: "Title must be 3–150 characters",
    },
    description: {
        required: true, minLength: 10,
        message: "Description must be at least 10 characters",
    },
    category: {
        required: false, enum: FOOD_CATEGORIES,
        message: `Category must be one of: ${FOOD_CATEGORIES.join(", ")}`,
    },
    quantity: {
        required: true, type: "number", min: 1,
        message: "Quantity must be a positive number",
    },
    unit: {
        required: false, maxLength: 30,
        message: "Unit must be under 30 characters",
    },
    servings: {
        required: false, type: "number", min: 0,
        message: "Servings must be a non-negative number",
    },
    expiryDate: {
        required: true, type: "date",
        message: "Expiry date must be a valid date",
    },
    pickupLocation: {
        required: false, maxLength: 255,
        message: "Pickup location must be under 255 characters",
    },
    pickupWindow: {
        required: false, maxLength: 150,
        message: "Pickup window must be under 150 characters",
    },
    city: {
        required: false, maxLength: 100,
        message: "City must be under 100 characters",
    },
    // V2 prediction inputs (optional; V1 fields unchanged)
    preparationDate: {
        required: false, type: "date",
        message: "Preparation date must be a valid date",
    },
    storageCondition: {
        required: false, enum: STORAGE_CONDITIONS,
        message: `Storage condition must be one of: ${STORAGE_CONDITIONS.join(", ")}`,
    },
    packaging: {
        required: false, enum: PACKAGING_TYPES,
        message: `Packaging must be one of: ${PACKAGING_TYPES.join(", ")}`,
    },
    temperature: {
        required: false, type: "number", min: -50, max: 100,
        message: "Temperature must be between -50 and 100",
    },
};

// updateFoodSchema: all fields optional, same rules as create
const updateFoodSchema = Object.fromEntries(
    Object.entries(createFoodSchema).map(([k, v]) => [k, { ...v, required: false }])
);

module.exports = { createFoodSchema, updateFoodSchema, FOOD_CATEGORIES, STORAGE_CONDITIONS, PACKAGING_TYPES };
