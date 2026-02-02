const sql = require('../db');

exports.getAllOfficers = async (req, res) => {
    try {
        const officers = await sql`
            SELECT id, name, email, department, ai_score, ai_result, ai_reason, document_url, account_status
            FROM users
            WHERE role = 'officer'
            ORDER BY created_at DESC
        `;
        res.json(officers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.approveOfficer = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await sql`
            UPDATE users
            SET account_status = 'ACTIVE', is_verified = TRUE
            WHERE id = ${id}
            RETURNING *
        `;
        if (result.length === 0) return res.status(404).json({ message: "Officer not found" });
        res.json({ message: "Officer approved", officer: result[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.rejectOfficer = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await sql`
            UPDATE users
            SET account_status = 'REJECTED', is_verified = FALSE
            WHERE id = ${id}
            RETURNING *
        `;
        if (result.length === 0) return res.status(404).json({ message: "Officer not found" });
        res.json({ message: "Officer rejected", officer: result[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getAllIssues = async (req, res) => {
    try {
        const issues = await sql`SELECT * FROM issues ORDER BY created_at DESC`;
        res.json(issues);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
