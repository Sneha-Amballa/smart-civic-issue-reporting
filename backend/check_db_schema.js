require('dotenv').config();
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
    try {
        console.log("Checking users table schema...");
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `;
        const columns = result.map(row => row.column_name);
        console.log("Columns found:", columns.join(", "));
    } catch (err) {
        console.error("Error connecting to DB:", err);
    }
}

checkSchema();
