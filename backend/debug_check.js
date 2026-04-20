require('dotenv').config();
const sql = require('./db');

async function debug() {
    try {
        console.log("--- Officers and Departments ---");
        const officers = await sql`SELECT id, name, email, department FROM users WHERE role = 'officer'`;
        officers.forEach(o => {
            console.log(`ID: ${o.id}, Name: ${o.name}, Dept: [${o.department}] (length: ${o.department?.length})`);
        });

        console.log("\n--- Issues and Categories ---");
        const issues = await sql`SELECT id, category, status, assigned_officer_id FROM issues WHERE status != 'Closed'`;
        issues.forEach(i => {
            console.log(`ID: ${i.id}, Category: [${i.category}] (length: ${i.category?.length}), Status: ${i.status}, Assigned: ${i.assigned_officer_id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
