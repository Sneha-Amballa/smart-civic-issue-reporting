require('dotenv').config();
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function alterTable() {
    try {
        console.log("Altering users table schema...");

        await sql`ALTER TABLE users ALTER COLUMN account_status TYPE VARCHAR(50)`;
        console.log("Updated account_status to VARCHAR(50)");

        await sql`ALTER TABLE users ALTER COLUMN ai_result TYPE VARCHAR(50)`;
        console.log("Updated ai_result to VARCHAR(50)");

        await sql`ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50)`;
        console.log("Updated role to VARCHAR(50)");

        console.log("All updates complete.");
    } catch (err) {
        console.error("Error altering DB:", err);
    }
}

alterTable();
