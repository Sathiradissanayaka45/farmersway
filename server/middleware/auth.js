const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Check Authorization header first
        const authHeader = req.headers.authorization;
        let token;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            // If no Authorization header, check cookies
            token = req.cookies?.token;
        }

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Additional middleware to check admin role
const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

// Middleware specifically for super admin actions
const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ message: 'Super Admin access required' });
    }
};

module.exports = { authMiddleware, adminOnly, superAdminOnly };
