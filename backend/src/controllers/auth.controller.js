const authService = require("../services/auth.service");

const registerUser = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const result = await authService.getProfile(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const result = await authService.updateProfile(req.user.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        const result = await authService.logout(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile, logoutUser };
