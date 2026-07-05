// routes/riceTypeRoutes.js
const express = require('express');
const router = express.Router();
const { 
    addRiceType, 
    getRiceTypes, 
    getRiceTypeById, 
    updateRiceType, 
    deleteRiceType 
} = require('../controllers/riceTypeController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Protected routes
router.post('/', authMiddleware, adminOnly, addRiceType);
router.get('/', authMiddleware, getRiceTypes);
router.get('/:id', authMiddleware, getRiceTypeById);
router.put('/:id', authMiddleware, adminOnly, updateRiceType);
router.delete('/:id', authMiddleware, adminOnly, deleteRiceType);

module.exports = router;