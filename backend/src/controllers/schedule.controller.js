const scheduleService = require("../services/schedule.service");

const createSchedule = async (req, res) => {
    try {
        const result = await scheduleService.create(req.user.id, req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const listDonorSchedules = async (req, res) => {
    try {
        const result = await scheduleService.listForDonor(req.user.id, req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const listNgoSchedules = async (req, res) => {
    try {
        const result = await scheduleService.listForNgo(req.user.id, req.query);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const acceptSchedule = async (req, res) => {
    try {
        const result = await scheduleService.accept(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const reschedule = async (req, res) => {
    try {
        const result = await scheduleService.reschedule(req.params.id, req.user.id, req.body.scheduledFor);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const cancelSchedule = async (req, res) => {
    try {
        const result = await scheduleService.cancel(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = {
    createSchedule, listDonorSchedules, listNgoSchedules,
    acceptSchedule, reschedule, cancelSchedule,
};
