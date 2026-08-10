/**
 * validate(schema) — express middleware factory
 * schema: { fieldName: { required, minLength, maxLength, pattern, enum, type, min, max, message } }
 * type supports: "number" | "date"
 */
const validate = (schema) => (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        const isEmpty = value === undefined || value === null || value === "";

        if (rules.required && isEmpty) {
            errors.push(`${field}: ${rules.message || "is required"}`);
            continue;
        }

        if (isEmpty) continue; // optional field not provided — skip remaining checks

        if (rules.type === "number") {
            const num = Number(value);
            if (Number.isNaN(num)) {
                errors.push(`${field}: ${rules.message || "must be a number"}`);
                continue;
            }
            if (rules.min !== undefined && num < rules.min) {
                errors.push(`${field}: ${rules.message || `must be at least ${rules.min}`}`);
                continue;
            }
            if (rules.max !== undefined && num > rules.max) {
                errors.push(`${field}: ${rules.message || `must be at most ${rules.max}`}`);
                continue;
            }
        }

        if (rules.type === "date") {
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) {
                errors.push(`${field}: ${rules.message || "must be a valid date"}`);
                continue;
            }
            if (rules.minDate !== undefined && d < rules.minDate) {
                errors.push(`${field}: ${rules.message || "date is too early"}`);
                continue;
            }
        }

        if (rules.minLength && String(value).length < rules.minLength) {
            errors.push(`${field}: ${rules.message}`);
            continue;
        }

        if (rules.maxLength && String(value).length > rules.maxLength) {
            errors.push(`${field}: ${rules.message}`);
            continue;
        }

        if (rules.pattern && !rules.pattern.test(String(value))) {
            errors.push(`${field}: ${rules.message}`);
            continue;
        }

        if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${field}: ${rules.message}`);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    next();
};

module.exports = { validate };
