// controllers/riceController.js - COMPLETE CORRECTED VERSION
const mysql = require('mysql2/promise');
require('dotenv').config();

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
        const { name, riceType } = req.body; // Changed to riceType (frontend sends this)
        const createdBy = req.user.id;

        console.log('Received data:', { name, riceType, createdBy }); // Debug log

        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Rice variety name is required'
            });
        }

        if (!riceType) {
            return res.status(400).json({ 
                success: false,
                message: 'Rice type is required'
            });
        }

        // Validate rice type exists
        const [riceTypeCheck] = await pool.query(
            'SELECT id, name FROM rice_types WHERE id = ?',
            [riceType]
        );

        if (riceTypeCheck.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid rice type'
            });
        }

        const [existing] = await pool.query(
            'SELECT id FROM rice_varieties WHERE LOWER(name) = LOWER(?)',
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

        // Get the created variety with type name
        const [newVariety] = await pool.query(`
            SELECT 
                rv.id, 
                rv.name, 
                rv.current_stock_kg, 
                rv.min_stock_level,
                rv.rice_type,
                rt.name as rice_type_name
            FROM rice_varieties rv
            LEFT JOIN rice_types rt ON rv.rice_type = rt.id
            WHERE rv.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Rice variety added successfully',
            data: newVariety[0]
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

// Get all rice varieties
const getRiceVarieties = async (req, res) => {
    try {
        const [varieties] = await pool.query(`
            SELECT 
                rv.id, 
                rv.name, 
                rv.current_stock_kg, 
                rv.min_stock_level,
                rv.rice_type,
                rt.name as rice_type_name,
                rv.created_at
            FROM rice_varieties rv
            LEFT JOIN rice_types rt ON rv.rice_type = rt.id
            ORDER BY rv.name ASC
        `);

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

// Update rice variety
const updateRiceVariety = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, riceType } = req.body;
        const userId = req.user.id;

        console.log('Update data:', { id, name, riceType, userId }); // Debug log

        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Rice variety name is required'
            });
        }

        if (!riceType) {
            return res.status(400).json({ 
                success: false,
                message: 'Rice type is required'
            });
        }

        // Validate rice type exists
        const [riceTypeCheck] = await pool.query(
            'SELECT id FROM rice_types WHERE id = ?',
            [riceType]
        );

        if (riceTypeCheck.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid rice type'
            });
        }

        // Check if name already exists (excluding current)
        const [existing] = await pool.query(
            'SELECT id FROM rice_varieties WHERE LOWER(name) = LOWER(?) AND id != ?',
            [name.trim(), id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Rice variety name already exists'
            });
        }

        const [result] = await pool.query(
            'UPDATE rice_varieties SET name = ?, rice_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name.trim(), riceType, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        res.json({
            success: true,
            message: 'Rice variety updated successfully'
        });
    } catch (error) {
        console.error('Error updating rice variety:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rice variety',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete rice variety
const deleteRiceVariety = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if rice variety has stock or is referenced elsewhere
        const [variety] = await pool.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [id]
        );

        if (variety.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        if (variety[0].current_stock_kg > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete rice variety with existing stock'
            });
        }

        const [result] = await pool.query(
            'DELETE FROM rice_varieties WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        res.json({
            success: true,
            message: 'Rice variety deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting rice variety:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete rice variety',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update rice variety stock
const updateRiceStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment, notes } = req.body;
        const userId = req.user.id;

        const adjustmentNum = parseFloat(adjustment);
        if (isNaN(adjustmentNum)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stock adjustment value'
            });
        }

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

        const currentStock = parseFloat(varieties[0].current_stock_kg);
        const newStock = currentStock + adjustmentNum;

        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock adjustment would result in negative inventory'
            });
        }

        await pool.query(
            'UPDATE rice_varieties SET current_stock_kg = ? WHERE id = ?',
            [newStock, id]
        );

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
        
        if (minStockLevel === undefined || minStockLevel < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid minimum stock level'
            });
        }

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
        const [varieties] = await pool.query(`
            SELECT rv.id, rv.name 
            FROM rice_varieties rv
            JOIN rice_types rt ON rv.rice_type = rt.id
            WHERE rt.name = 'paddy' 
            ORDER BY rv.name ASC
        `);
        res.json({ success: true, data: varieties });
    } catch (error) {
        console.error('Error fetching paddy rice varieties:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch paddy rice varieties' });
    }
};

const getSellingRiceVarieties = async (req, res) => {
    try {
        const [varieties] = await pool.query(`
            SELECT rv.id, rv.name 
            FROM rice_varieties rv
            JOIN rice_types rt ON rv.rice_type = rt.id
            WHERE rt.name = 'selling' 
            ORDER BY rv.name ASC
        `);
        res.json({ success: true, data: varieties });
    } catch (error) {
        console.error('Error fetching selling rice varieties:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch selling rice varieties' });
    }
};

module.exports = {
    addRiceVariety,
    getRiceVarieties,
    updateRiceVariety,  // Added this
    deleteRiceVariety,  // Added this
    updateRiceStock,
    updateMinStockLevel,
    getPaddyRiceVarieties,
    getSellingRiceVarieties
};