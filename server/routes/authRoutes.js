const express = require('express');
const router = express.Router();
const { login, logout, getProfile, createAdmin, getUsers } = require('../controllers/authController');
const { authMiddleware, adminOnly, superAdminOnly } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.post('/create-admin', authMiddleware, superAdminOnly, createAdmin);
router.get('/users', authMiddleware, adminOnly, getUsers);

module.exports = router;
