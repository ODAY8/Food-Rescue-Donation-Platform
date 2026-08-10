const inventoryService = require("../services/inventory.service");

const listItems = async (req, res) => {
    try {
        const result = await inventoryService.list(req.user.id, req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getItem = async (req, res) => {
    try {
        const result = await inventoryService.getById(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const createItem = async (req, res) => {
    try {
        const result = await inventoryService.create(req.user.id, req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateItem = async (req, res) => {
    try {
        const result = await inventoryService.update(req.params.id, req.user.id, req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const removeItem = async (req, res) => {
    try {
        const result = await inventoryService.remove(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const adjustItem = async (req, res) => {
    try {
        const result = await inventoryService.adjust(req.params.id, req.user.id, req.body.delta, req.body.note);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const donateFromInventory = async (req, res) => {
    try {
        const result = await inventoryService.donate(req.params.id, req.user.id, req.body.quantity, req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getHistory = async (req, res) => {
    try {
        const result = await inventoryService.history(req.user.id, req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const markExpired = async (req, res) => {
    try {
        const result = await inventoryService.markExpired(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = {
    listItems, getItem, createItem, updateItem, removeItem,
    adjustItem, donateFromInventory, getHistory, markExpired,
};
