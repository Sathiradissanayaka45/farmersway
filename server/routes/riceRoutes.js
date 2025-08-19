const express = require('express');
const router = express.Router();
const { addRiceVariety, getRiceVarieties, updateMinStockLevel,  getPaddyRiceVarieties, getSellingRiceVarieties} = require('../controllers/riceController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Protected routes (admin only)
router.post('/', authMiddleware, adminOnly, addRiceVariety);
router.get('/', authMiddleware, getRiceVarieties);
router.put('/:id/min-stock', authMiddleware, updateMinStockLevel);
router.get('/paddy', authMiddleware, getPaddyRiceVarieties);
router.get('/selling', authMiddleware, getSellingRiceVarieties);

module.exports = router;