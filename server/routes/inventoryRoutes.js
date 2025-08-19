const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const { 
    getRiceVarieties,
    updateRiceStock
} = require('../controllers/riceController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Get current inventory levels
router.get('/', authMiddleware, getRiceVarieties);

// Update stock level (admin only)
router.post('/:id/adjust', authMiddleware, adminOnly, updateRiceStock);
// Get inventory adjustment history
router.get('/adjustments', authMiddleware, async (req, res) => {
    try {
        const [adjustments] = await pool.query(`
            SELECT ia.*, rv.name as rice_variety_name, u.username as adjusted_by_name
            FROM inventory_adjustments ia
            JOIN rice_varieties rv ON ia.rice_variety_id = rv.id
            JOIN admin_users u ON ia.adjusted_by = u.id
            ORDER BY ia.adjustment_date DESC
        `);

        res.json({
            success: true,
            data: adjustments
        });
    } catch (error) {
        console.error('Error fetching inventory adjustments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory adjustments'
        });
    }
});

// Get low stock items
router.get('/low-stock', authMiddleware, async (req, res) => {
    try {
        const [items] = await pool.query(`
            SELECT id, name, current_stock_kg, min_stock_level
            FROM rice_varieties
            WHERE current_stock_kg <= min_stock_level
            ORDER BY current_stock_kg ASC
        `);

        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch low stock items'
        });
    }
});
module.exports = router;