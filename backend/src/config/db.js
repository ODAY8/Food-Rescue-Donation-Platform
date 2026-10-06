const { Pool } = require("pg");

let connectionString = process.env.DATABASE_URL || "";
if (connectionString.includes("sslmode=require")) {
    connectionString = connectionString.replace("sslmode=require", "sslmode=no-verify");
}

const pool = new Pool({ connectionString });

module.exports = pool;

