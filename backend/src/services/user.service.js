const UserModel = require("../models/user.model");

const getAllUsers = async (query = {}) => {
    const users = await UserModel.findAll(query);
    return { success: true, data: users };
};

const getUserById = async (id) => {
    const user = await UserModel.findByIdWithDetails(id);
    if (!user) throw new Error("User not found");
    return { success: true, data: user };
};

const deleteUser = async (id) => {
    const user = await UserModel.findById(id);
    if (!user) throw new Error("User not found");
    await UserModel.delete(id);
    return { success: true, message: "User deleted successfully" };
};

module.exports = { getAllUsers, getUserById, deleteUser };
