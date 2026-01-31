const sql = require('../db');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { sendOTP } = require('../utils/emailService');

const generateToken = (id, role, language) => {
    return jwt.sign({ id, role, language }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. Citizen Signup
exports.signup = async (req, res) => {
    const { name, email, phone, preferred_language } = req.body;

    try {
        // Check if user exists
        const userCheck = await sql`SELECT * FROM users WHERE email = ${email} OR phone = ${phone}`;
        if (userCheck.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await sql`
            INSERT INTO users (name, email, phone, role, preferred_language, is_verified) 
            VALUES (${name}, ${email}, ${phone}, 'citizen', ${preferred_language || 'en'}, false) 
            RETURNING *
        `;

        res.status(201).json({ message: 'User registered successfully', user: newUser[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. Send OTP
exports.sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await sql`UPDATE users SET otp = ${otp}, otp_expiry = ${otpExpiry} WHERE email = ${email}`;

        const emailSent = await sendOTP(email, otp);
        if (emailSent) {
            res.json({ message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 3. Verify OTP (For initial verification or login)
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // OTP Valid
        await sql`UPDATE users SET is_verified = true, otp = NULL, otp_expiry = NULL WHERE email = ${email}`;

        res.json({ message: 'OTP Verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 4. Login (Initiate)
exports.login = async (req, res) => {
    const { email } = req.body;

    try {
        const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found. Please signup.' });
        }

        // Generate and send OTP
        const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await sql`UPDATE users SET otp = ${otp}, otp_expiry = ${otpExpiry} WHERE email = ${email}`;

        const emailSent = await sendOTP(email, otp);
        if (emailSent) {
            res.json({ message: 'OTP sent to email' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 5. Login Verify -> Issue Token
exports.loginVerify = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (!user.is_verified) {
            await sql`UPDATE users SET is_verified = true WHERE email = ${email}`;
        }

        // Clear OTP
        await sql`UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ${user.id}`;

        const token = generateToken(user.id, user.role, user.preferred_language);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                preferred_language: user.preferred_language
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
