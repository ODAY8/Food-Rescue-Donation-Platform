const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Prisma 7 uses a driver adapter for the database connection.
// The adapter reads the connection string from DATABASE_URL.
const prisma = global.__prisma || new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
    global.__prisma = prisma;
}

module.exports = prisma;
