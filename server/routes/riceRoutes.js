// routes/riceRoutes.js
const express = require('express');
const router = express.Router();
const { 
    addRiceVariety, 
    getRiceVarieties, 
    updateRiceVariety,
    deleteRiceVariety,
    updateRiceStock, 
    updateMinStockLevel,
    getPaddyRiceVarieties,
    getSellingRiceVarieties
} = require('../controllers/riceController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Protected routes (admin only for create, update, delete)
router.post('/', authMiddleware, adminOnly, addRiceVariety);
router.get('/', authMiddleware, getRiceVarieties);
router.put('/:id', authMiddleware, adminOnly, updateRiceVariety); // Add this
router.delete('/:id', authMiddleware, adminOnly, deleteRiceVariety); // Add this
router.put('/:id/stock', authMiddleware, adminOnly, updateRiceStock);
router.put('/:id/min-stock', authMiddleware, adminOnly, updateMinStockLevel);
router.get('/paddy', authMiddleware, getPaddyRiceVarieties);
router.get('/selling', authMiddleware, getSellingRiceVarieties);

module.exports = router;