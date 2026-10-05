const { FOOD_CATEGORIES } = require("./food.validation");

const searchQuerySchema = {
    q: { required: false, maxLength: 100, message: "Search term must be under 100 characters" },
    category: { required: false, enum: FOOD_CATEGORIES, message: `Category must be one of: ${FOOD_CATEGORIES.join(", ")}` },
    city: { required: false, maxLength: 100, message: "City must be under 100 characters" },
    status: { required: false, enum: ["AVAILABLE", "CLAIMED", "EXPIRED"], message: "Invalid status filter" },
    availability: { required: false, enum: ["true", "false"], message: "Availability must be true or false" },
    expiryBefore: { required: false, type: "date", message: "expiryBefore must be a valid date" },
    expiryAfter: { required: false, type: "date", message: "expiryAfter must be a valid date" },
    urgency: { required: false, type: "number", min: 1, max: 720, message: "Urgency must be hours (1–720)" },
    minQty: { required: false, type: "number", min: 0, message: "minQty must be a non-negative number" },
    maxQty: { required: false, type: "number", min: 0, message: "maxQty must be a non-negative number" },
    lat: { required: false, type: "number", min: -90, max: 90, message: "lat must be a valid latitude" },
    lng: { required: false, type: "number", min: -180, max: 180, message: "lng must be a valid longitude" },
    sort: { required: false, enum: ["expiring", "quantity", "recent", "relevance", "nearest"], message: "Invalid sort option" },
    page: { required: false, type: "number", min: 1, message: "Page must be a positive number" },
    limit: { required: false, type: "number", min: 1, max: 50, message: "Limit must be 1–50" },
};

module.exports = { searchQuerySchema };
