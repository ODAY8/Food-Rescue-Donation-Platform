const PLATFORM_ROLES = ["donor", "ngo", "recipient"];

const registerSchema = {
    name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        message: "Name must be between 2 and 100 characters",
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "A valid email address is required",
    },
    password: {
        required: true,
        minLength: 8,
        message: "Password must be at least 8 characters",
    },
    role: {
        required: false,
        enum: PLATFORM_ROLES,
        message: `Role must be one of: ${PLATFORM_ROLES.join(", ")}`,
    },
};

const loginSchema = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "A valid email address is required",
    },
    password: {
        required: true,
        message: "Password is required",
    },
};

const updateProfileSchema = {
    name: {
        required: false,
        minLength: 2,
        maxLength: 100,
        message: "Name must be between 2 and 100 characters",
    },
    email: {
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "A valid email address is required",
    },
    organization: {
        required: false,
        maxLength: 150,
        message: "Organization name must be under 150 characters",
    },
};

module.exports = { registerSchema, loginSchema, updateProfileSchema, PLATFORM_ROLES };
