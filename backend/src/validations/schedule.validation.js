const { FOOD_CATEGORIES } = require("./food.validation");

const createScheduleSchema = {
    foodId: {
        required: false, maxLength: 64,
        message: "Food id must be valid",
    },
    title: {
        required: false, minLength: 3, maxLength: 150,
        message: "Title must be 3–150 characters",
    },
    description: {
        required: false, maxLength: 1000,
        message: "Description must be under 1000 characters",
    },
    category: {
        required: false, enum: FOOD_CATEGORIES,
        message: `Category must be one of: ${FOOD_CATEGORIES.join(", ")}`,
    },
    quantity: {
        required: false, type: "number", min: 1,
        message: "Quantity must be a positive number",
    },
    unit: {
        required: false, maxLength: 30,
        message: "Unit must be under 30 characters",
    },
    expiryDate: {
        required: false, type: "date",
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
    scheduledFor: {
        required: true, type: "date",
        message: "Scheduled pickup date must be a valid date",
    },
    notes: {
        required: false, maxLength: 255,
        message: "Notes must be under 255 characters",
    },
};

const rescheduleSchema = {
    scheduledFor: {
        required: true, type: "date",
        message: "Scheduled pickup date must be a valid date",
    },
};

const qrValidateSchema = {
    code: {
        required: true, maxLength: 48, pattern: /^FRD-[a-f0-9]{32}$/,
        message: "Invalid QR code format",
    },
};

const platformEventSchema = {
    type: {
        required: true, enum: ["LANGUAGE_CHANGE"],
        message: "Event type must be LANGUAGE_CHANGE",
    },
    metadata: {
        required: false, maxLength: 500,
        message: "Event metadata must be under 500 characters",
    },
};

module.exports = { createScheduleSchema, rescheduleSchema, qrValidateSchema, platformEventSchema };
