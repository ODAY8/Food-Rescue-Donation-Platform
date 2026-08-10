const DONATION_STATUSES = [
    "PENDING", "APPROVED", "REJECTED", "PICKUP_SCHEDULED",
    "COLLECTED", "DELIVERED", "COMPLETED", "CANCELLED", "EXPIRED",
];

const updateDonationStatusSchema = {
    status: {
        required: true,
        enum: DONATION_STATUSES,
        message: `Status must be one of: ${DONATION_STATUSES.join(", ")}`,
    },
};

module.exports = { updateDonationStatusSchema, DONATION_STATUSES };
