const sql = require('../db');
const axios = require('axios');

exports.reportIssue = async (req, res) => {
    try {
        const { image, voiceText, language, latitude, longitude, status, timestamp } = req.body;
        const citizen_id = req.user.id; // From authMiddleware

        if (!image || !latitude || !longitude) {
            return res.status(400).json({ message: 'Missing required fields (Image & Location)' });
        }

        // Call AI Service
        let aiResult = {
            category: 'Uncategorized',
            ai_status: 'Pending',
            ai_confidence: 0,
            ai_reason: 'AI Service unavailable'
        };

        try {
            const aiResponse = await axios.post('http://localhost:8000/analyze',
                { image, text: voiceText || '' },
                { timeout: 15000 } // 15s timeout for AI processing
            );
            aiResult = aiResponse.data;
        } catch (aiErr) {
            console.error('AI Service Connection Failed:', aiErr.message);
            if (aiErr.response) {
                console.error('AI Service Response:', aiErr.response.data);
            }
        }

        const issues = await sql`
            INSERT INTO issues (
                citizen_id, image, voice_text, language, category, latitude, longitude, status, timestamp,
                ai_status, ai_confidence, ai_reason
            ) VALUES (
                ${citizen_id}, ${image}, ${voiceText}, ${language}, ${aiResult.category}, ${latitude}, ${longitude}, ${status || 'Reported'}, ${timestamp || new Date()},
                ${aiResult.ai_status}, ${aiResult.ai_confidence}, ${aiResult.ai_reason}
            )
            RETURNING id, category, status, timestamp, ai_status
        `;

        res.status(201).json({ message: 'Issue reported successfully', issue: issues[0] });
    } catch (err) {
        console.error('Error reporting issue:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyIssues = async (req, res) => {
    try {
        const citizen_id = req.user.id;
        // Optimize: Exclude 'image' column to speed up list loading
        const issues = await sql`
            SELECT id, category, status, timestamp, voice_text, latitude, longitude, language, created_at, ai_status 
            FROM issues 
            WHERE citizen_id = ${citizen_id} 
            ORDER BY created_at DESC
        `;
        res.json(issues);
    } catch (err) {
        console.error('Error fetching issues:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getIssueDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const citizen_id = req.user.id;

        // Fetch full details including image
        const issues = await sql`
            SELECT * FROM issues 
            WHERE id = ${id} AND citizen_id = ${citizen_id}
        `;

        if (issues.length === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issues[0]);
    } catch (err) {
        console.error('Error fetching issue details:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
