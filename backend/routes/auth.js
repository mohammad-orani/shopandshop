// routes/auth.js — Authentication routes

const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool     = require('../db');
const { authenticateToken, logAction } = require('../middleware');

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many login attempts, please try again later.' }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query(
            'SELECT id, email, name, password FROM users WHERE email = ?', [email]
        );
        if (users.length === 0)
            return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const user = users[0];
        const isHashed = user.password && user.password.startsWith('$2');
        let passwordMatch = false;
        if (isHashed) {
            passwordMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plain-text — compare and auto-upgrade to bcrypt
            passwordMatch = password === user.password;
            if (passwordMatch) {
                const hashed = await bcrypt.hash(password, 12);
                await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
                console.log(`Auto-upgraded password hash for user ${user.email}`);
            }
        }

        if (!passwordMatch)
            return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const token = jwt.sign(
            { userId: user.id, email: user.email, name: user.name, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await logAction(
            { ...req, user: { userId: user.id, name: user.name || user.email } },
            'LOGIN', 'auth', user.id, `Logged in as ${user.email}`
        );

        res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name || user.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
    }
});

// POST /api/auth/change-password
router.post('/change-password', authLimiter, authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password)
            return res.status(400).json({ success: false, error: 'Both current and new password are required' });
        if (new_password.length < 8)
            return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });

        const [users] = await pool.query('SELECT id, password FROM users WHERE id = ?', [req.user.userId]);
        if (users.length === 0)
            return res.status(404).json({ success: false, error: 'User not found' });

        const user = users[0];
        const isHashed = user.password && user.password.startsWith('$2');
        let passwordMatch = false;
        if (isHashed) {
            passwordMatch = await bcrypt.compare(current_password, user.password);
        } else {
            passwordMatch = current_password === user.password;
        }

        if (!passwordMatch)
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });

        const hashedNew = await bcrypt.hash(new_password, 12);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, req.user.userId]);
        await logAction(req, 'PASSWORD_CHANGE', 'auth', req.user.userId,
            `Password changed for user ID: ${req.user.userId}`);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to change password: ' + error.message });
    }
});

module.exports = router;
