const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Login controller
const login = async (req, res) => {
    try {
        console.log('Login attempt:', req.body); // Debug log
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            console.log('Missing credentials'); // Debug log
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Get user from database
        const [users] = await pool.query(
            'SELECT * FROM admin_users WHERE username = ? AND is_active = true',
            [username]
        );

        const user = users[0];
        console.log('User found:', user ? 'Yes' : 'No'); // Debug log

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid); // Debug log

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        await pool.query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate token
        const token = generateToken(user);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to false for development
            sameSite: 'lax', // Changed to lax for development
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Send response with token
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            token: token  // Include the token in response
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Logout controller
const logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role, last_login FROM admin_users WHERE id = ?',
            [req.user.id]
        );

        if (!users.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new admin user (Super Admin only)
const createAdmin = async (req, res) => {
    try {
        const { username, email, password, full_name, role = 'admin' } = req.body;

        // Input validation
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ 
                message: 'All fields are required',
                details: {
                    username: !username ? 'Username is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null,
                    full_name: !full_name ? 'Full name is required' : null
                }
            });
        }

        // Check if username or email already exists
        const [existingUsers] = await pool.query(
            'SELECT username, email FROM admin_users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        await pool.query(
            'INSERT INTO admin_users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, role]
        );

        res.status(201).json({ message: 'Admin user created successfully' });
    } catch (error) {
        console.error('Create admin error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('username')) {
                return res.status(400).json({ message: 'Username already exists' });
            } else if (error.message.includes('email')) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all users (Admin only)
const getUsers = async (req, res) => {
    try {
        // Check if user is admin or super_admin
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role, last_login, created_at FROM admin_users WHERE is_active = true'
        );

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

module.exports = {
    login,
    logout,
    getProfile,
    createAdmin,
    getUsers
};
