const sql = require('../db');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===============================
// REPORT ISSUE
// ===============================
exports.reportIssue = async (req, res) => {
    try {
        const {
            image,          // base64 from frontend
            voiceText,
            language,
            latitude,
            longitude,
            status,
            timestamp
        } = req.body;

        const citizen_id = req.user.id;

        // ------------------------------
        // 1️⃣ Validation
        // ------------------------------
        if (!image || !latitude || !longitude) {
            return res.status(400).json({
                message: 'Image and location are required'
            });
        }

        // ------------------------------
        // 2️⃣ Upload image to Cloudinary (FAST CDN)
        // ------------------------------
        let imageUrl = '';

        try {
            // Check if image is base64 (starts with data:image)
            if (image.startsWith('data:image')) {
                const uploadResult = await cloudinary.uploader.upload(image, {
                    folder: 'civic_issues',
                    resource_type: 'image'
                });
                imageUrl = uploadResult.secure_url;
            } else {
                // If already a URL (rare but possible), just use it
                imageUrl = image;
            }

        } catch (err) {
            console.error('Cloudinary upload failed:', err.message);
            // Fallback: If upload fails, we might still want to save, BUT it's heavy.
            // For now, let's return error to user.
            return res.status(500).json({ message: 'Image upload failed' });
        }

        // ------------------------------
        // 3️⃣ Call AI Service
        // ------------------------------
        let aiResult = {
            category: 'Uncategorized',
            ai_status: 'PENDING',
            ai_confidence: 0,
            ai_reason: 'AI service unavailable'
        };

        try {
            const aiResponse = await axios.post(
                'http://localhost:8000/analyze',
                {
                    image, // Sending base64 to AI if needed in future
                    text: voiceText || ''
                },
                { timeout: 15000 }
            );

            if (aiResponse.data) {
                aiResult = aiResponse.data;
            }
        } catch (err) {
            console.error('AI Service Error:', err.message);
        }

        // ------------------------------
        // 4️⃣ Determine Status (Handle FLAGGED)
        // ------------------------------
        let issueStatus = 'Reported';

        // If AI explicitly says FLAGGED, mark it.
        // Also check if status was manually set (less likely from citizen)
        if (aiResult.ai_status === 'FLAGGED' || aiResult.category === 'Flagged') {
            issueStatus = 'Flagged';
        }

        // ------------------------------
        // 5️⃣ Save Issue in DB
        // ------------------------------
        const issues = await sql`
            INSERT INTO issues (
                citizen_id,
                image,
                voice_text,
                language,
                category,
                latitude,
                longitude,
                status,
                timestamp,
                ai_status,
                ai_confidence,
                ai_reason
            ) VALUES (
                ${citizen_id},
                ${imageUrl},
                ${voiceText || ''},
                ${language || 'en'},
                ${aiResult.category},
                ${latitude},
                ${longitude},
                ${issueStatus},
                ${timestamp || new Date()},
                ${aiResult.ai_status},
                ${aiResult.ai_confidence},
                ${aiResult.ai_reason}
            )
            RETURNING id, category, status, timestamp, ai_status
        `;

        // If flagged, maybe we tell the user? 
        // Or we just say "Reported" to avoid confrontation?
        // User request: "if a issue is flagged it should not get reported" -> This usually means "don't show up on valid lists".
        // But we return success here. The logic is now handled by status 'Flagged'.

        res.status(201).json({
            message: issueStatus === 'Flagged' ? 'Issue flagged for review' : 'Issue reported successfully',
            issue: issues[0]
        });

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
        const citizen_id = req.user.id; // Corrected: Using authMiddleware user

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

// Admin function to get ALL details (just in case needed here, though adminController usually handles it)
exports.getAllIssues = async (req, res) => {
    // This logic is usually in adminController, checking just in case.
};
