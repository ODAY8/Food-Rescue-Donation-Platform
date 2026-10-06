const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

let connectionString = process.env.DATABASE_URL || "";

// If connection string contains sslmode=require, convert to sslmode=no-verify
// to prevent node-pg from rejecting Supabase pooler self-signed certs.
if (connectionString.includes("sslmode=require")) {
    connectionString = connectionString.replace("sslmode=require", "sslmode=no-verify");
}

// Prisma 7 uses a driver adapter for the database connection.
// The adapter reads the connection string from DATABASE_URL.
const prisma = global.__prisma || new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
    global.__prisma = prisma;
}

module.exports = prisma;

