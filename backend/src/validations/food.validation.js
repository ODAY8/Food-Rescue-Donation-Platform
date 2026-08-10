const FOOD_CATEGORIES = ["Produce", "Dairy", "Bakery", "Meat", "Prepared", "Beverages", "Pantry", "Other"];

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
};

// updateFoodSchema: all fields optional, same rules as create
const updateFoodSchema = Object.fromEntries(
    Object.entries(createFoodSchema).map(([k, v]) => [k, { ...v, required: false }])
);

module.exports = { createFoodSchema, updateFoodSchema, FOOD_CATEGORIES };
