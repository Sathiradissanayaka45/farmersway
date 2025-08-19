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

// Add new rice variety
const addRiceVariety = async (req, res) => {
    try {
        const { name, riceType } = req.body;
        const createdBy = req.user.id;

        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Rice variety name is required'
            });
        }

        if (!['paddy', 'selling'].includes(riceType)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid rice type'
            });
        }

        const [existing] = await pool.query(
            'SELECT id FROM rice_varieties WHERE name = ?',
            [name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Rice variety already exists'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO rice_varieties (name, rice_type, created_by) VALUES (?, ?, ?)',
            [name.trim(), riceType, createdBy]
        );

        res.status(201).json({
            success: true,
            message: 'Rice variety added successfully',
            data: {
                id: result.insertId,
                name: name.trim(),
                riceType
            }
        });
    } catch (error) {
        console.error('Error adding rice variety:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add rice variety',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getRiceVarieties = async (req, res) => {
    try {
        const [varieties] = await pool.query(
            'SELECT id, name, current_stock_kg, min_stock_level,rice_type FROM rice_varieties ORDER BY name ASC'
        );

        // Add stock status
        const varietiesWithStatus = varieties.map(variety => ({
            ...variety,
            stock_status: variety.current_stock_kg <= variety.min_stock_level ? 'low' : 'ok'
        }));

        res.json({
            success: true,
            data: varietiesWithStatus
        });
    } catch (error) {
        console.error('Error fetching rice varieties:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rice varieties'
        });
    }
};

// Update rice variety stock (admin only)
const updateRiceStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment, notes } = req.body;
        const userId = req.user.id;

        // Convert adjustment to number
        const adjustmentNum = parseFloat(adjustment);
        if (isNaN(adjustmentNum)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stock adjustment value'
            });
        }

        // Get current stock
        const [varieties] = await pool.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [id]
        );

        if (varieties.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        // Convert current stock to number
        const currentStock = parseFloat(varieties[0].current_stock_kg);
        const newStock = currentStock + adjustmentNum;

        // Prevent negative stock
        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock adjustment would result in negative inventory'
            });
        }

        // Update stock
        await pool.query(
            'UPDATE rice_varieties SET current_stock_kg = ? WHERE id = ?',
            [newStock, id]
        );

        // Record inventory adjustment
        await pool.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [id, adjustmentNum, currentStock, newStock, notes, userId]
        );

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: {
                rice_variety_id: id,
                previous_stock: currentStock,
                new_stock: newStock
            }
        });

    } catch (error) {
        console.error('Error updating rice stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rice stock',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateMinStockLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const { minStockLevel } = req.body;
        
        // Validate input
        if (minStockLevel === undefined || minStockLevel < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid minimum stock level'
            });
        }

        // Update in database
        await pool.query(
            'UPDATE rice_varieties SET min_stock_level = ? WHERE id = ?',
            [minStockLevel, id]
        );

        res.json({
            success: true,
            message: 'Minimum stock level updated successfully'
        });

    } catch (error) {
        console.error('Error updating minimum stock level:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update minimum stock level'
        });
    }
};
const getPaddyRiceVarieties = async (req, res) => {
    try {
        const [varieties] = await pool.query(
            'SELECT id, name FROM rice_varieties WHERE rice_type = "paddy" ORDER BY name ASC'
        );
        res.json({ success: true, data: varieties });
    } catch (error) {
        console.error('Error fetching paddy rice varieties:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch paddy rice varieties' });
    }
};

const getSellingRiceVarieties = async (req, res) => {
    try {
        const [varieties] = await pool.query(
            'SELECT id, name FROM rice_varieties WHERE rice_type = "selling" ORDER BY name ASC'
        );
        res.json({ success: true, data: varieties });
    } catch (error) {
        console.error('Error fetching selling rice varieties:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch selling rice varieties' });
    }
};

module.exports = {
    addRiceVariety,
    getRiceVarieties,
    updateRiceStock,
    updateMinStockLevel,
        getPaddyRiceVarieties,
    getSellingRiceVarieties
};