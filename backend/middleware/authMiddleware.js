const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ecoswap_super_secret_jwt_key_2024';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // decoded contains: userId, email, name, role
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
};

module.exports = authMiddleware;
