require('dotenv').config();
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function checkSchemaDetails() {
    try {
        console.log("Checking users table schema details...");
        const result = await sql`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `;
        result.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type} (${row.character_maximum_length})`);
        });
    } catch (err) {
        console.error("Error connecting to DB:", err);
    }
}

checkSchemaDetails();
