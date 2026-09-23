const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logSecurityEvent } = require('../middleware/securityMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'ecoswap_super_secret_jwt_key_2024';
const JWT_EXPIRES_IN = '7d';

const signToken = (user) =>
    jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

exports.register = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;
        const role = ['user', 'admin', 'auditor'].includes(req.body.role) ? req.body.role : 'user';

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (name.trim().length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters.' });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, passwordHash, role });
        const token = signToken(user);

        // Audit log
        await logSecurityEvent({
            eventType: 'AUTH_REGISTER',
            userId: user._id,
            userEmail: user.email,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || '',
            status: 'SUCCESS',
            details: `New account registered with role: ${role}`,
        });

        res.status(201).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            await logSecurityEvent({
                eventType: 'AUTH_LOGIN_FAILED',
                userEmail: email,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
                userAgent: req.headers['user-agent'] || '',
                status: 'FAILURE',
                details: 'User not found',
            });
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            await logSecurityEvent({
                eventType: 'AUTH_LOGIN_FAILED',
                userId: user._id,
                userEmail: email,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
                userAgent: req.headers['user-agent'] || '',
                status: 'FAILURE',
                details: 'Incorrect password',
            });
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = signToken(user);

        // Audit log
        await logSecurityEvent({
            eventType: 'AUTH_LOGIN',
            userId: user._id,
            userEmail: user.email,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || '',
            status: 'SUCCESS',
            details: `Login successful – role: ${user.role}`,
        });

        res.json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash -apiKey');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
