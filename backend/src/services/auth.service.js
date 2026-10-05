const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

const SALT_ROUNDS = 12;

// Map frontend role strings to Prisma enum values
const ROLE_MAP = { donor: "DONOR", ngo: "NGO", recipient: "NGO" };
// Map Prisma enum back to frontend role label
const ROLE_REVERSE = { DONOR: "donor", NGO: "ngo", ADMIN: "admin" };

const signToken = (user) =>
    jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const formatUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    platformRole: ROLE_REVERSE[user.role] || "donor",
    organization: user.organization,
});

const register = async ({ name, email, password, organization, role: frontendRole = "donor" }) => {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error("An account with this email already exists");

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const prismaRole = ROLE_MAP[frontendRole] || "DONOR";
    const user = await UserModel.create({ name, email, password: hashed, organization, role: prismaRole });

    return { success: true, token: signToken(user), data: formatUser(user) };
};

const login = async ({ email, password }) => {
    const user = await UserModel.findByEmail(email);
    const dummyHash = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
    const match = user
        ? await bcrypt.compare(password, user.password)
        : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !match) throw new Error("Invalid email or password");

    return { success: true, token: signToken(user), data: formatUser(user) };
};

const getProfile = async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    return {
        success: true,
        data: {
            ...user,
            platform_role: ROLE_REVERSE[user.role] || "donor",
        },
    };
};

const updateProfile = async (userId, fields) => {
    const user = await UserModel.update(userId, fields);
    if (!user) throw new Error("User not found");
    return {
        success: true,
        data: {
            ...user,
            platform_role: ROLE_REVERSE[user.role] || "donor",
        },
    };
};

const logout = async () => ({ success: true, message: "Logged out successfully" });

module.exports = { register, login, getProfile, updateProfile, logout };
