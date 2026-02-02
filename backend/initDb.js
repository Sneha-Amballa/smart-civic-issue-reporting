require('dotenv').config();
const sql = require('./db');

const initDb = async () => {
    try {
        console.log('Connecting to database...');

        await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(15),
                role VARCHAR(20) CHECK (role IN ('citizen', 'officer', 'admin')),
                preferred_language VARCHAR(10) DEFAULT 'en',
                otp VARCHAR(6),
                otp_expiry TIMESTAMP,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS issues (
                id SERIAL PRIMARY KEY,
                citizen_id UUID REFERENCES users(id),
                image TEXT,
                voice_text TEXT,
                language VARCHAR(10),
                category VARCHAR(50),
                latitude DECIMAL(10, 7),
                longitude DECIMAL(10, 7),
                timestamp TIMESTAMP,
                status VARCHAR(20) DEFAULT 'Reported',
                assigned_officer_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;


        // Add AI columns if they don't exist (Manual migration)
        try {
            await sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) DEFAULT 'Pending'`;
            await sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(5,2)`;
            await sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_reason TEXT`;
            console.log("AI columns added to 'issues' table.");
        } catch (alterErr) {
            console.log("AI columns might already exist or error in issues:", alterErr.message);
        }

        // Add Officer columns to Users table
        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100)`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'PENDING'`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS document_url TEXT`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_score DECIMAL(5,2)`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_result VARCHAR(20)`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_reason TEXT`;
            console.log("Officer columns added to 'users' table.");
        } catch (alterErr) {
            console.log("Officer columns might already exist or error in users:", alterErr.message);
        }

        console.log('Tables "users" and "issues" created successfully (if they didn\'t exist).');
    } catch (err) {
        console.error('Error creating table:', err);
    }
};


initDb();
