const FoodModel = require("../models/food.model");

const createFood = async (body, userId) => {
    const { title, description, quantity, servings, expiryDate, category, city, pickupLocation, pickupAddress, pickupWindow, latitude, longitude, imageUrl, preparationDate, storageCondition, packaging, temperature } = body;
    const food = await FoodModel.create(
        { title, description, quantity, servings, expiryDate, category, city, pickupLocation, pickupAddress, pickupWindow, latitude, longitude, imageUrl, preparationDate, storageCondition, packaging, temperature },
        userId
    );
    return { success: true, data: food };
};

const getAllFoods = async (query = {}) => {
    const foods = await FoodModel.findAll(query);
    return { success: true, data: foods };
};

const getFoodById = async (id) => {
    const food = await FoodModel.findById(id);
    if (!food) throw new Error("Food listing not found");
    return { success: true, data: food };
};

const getMyFoods = async (userId) => {
    const foods = await FoodModel.findByDonorId(userId);
    return { success: true, data: foods };
};

const updateFood = async (id, data, userId) => {
    const food = await FoodModel.findById(id);
    if (!food) throw new Error("Food listing not found");
    if (food.donorId !== userId) throw new Error("Not authorized to update this listing");
    const updated = await FoodModel.update(id, data);
    return { success: true, data: updated };
};

const deleteFood = async (id, userId) => {
    const food = await FoodModel.findById(id);
    if (!food) throw new Error("Food listing not found");
    if (food.donorId !== userId) throw new Error("Not authorized to delete this listing");
    await FoodModel.delete(id);
    return { success: true, message: "Food listing deleted" };
};

module.exports = { createFood, getAllFoods, getFoodById, getMyFoods, updateFood, deleteFood };
