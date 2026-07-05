// controllers/riceTypeController.js
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

// Add new rice type
const addRiceType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const createdBy = req.user.id;

        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Rice type name is required'
            });
        }

        // Check if rice type already exists
        const [existing] = await pool.query(
            'SELECT id FROM rice_types WHERE name = ?',
            [name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Rice type already exists'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO rice_types (name, description, created_by) VALUES (?, ?, ?)',
            [name.trim(), description, createdBy]
        );

        res.status(201).json({
            success: true,
            message: 'Rice type added successfully',
            data: {
                id: result.insertId,
                name: name.trim(),
                description
            }
        });
    } catch (error) {
        console.error('Error adding rice type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add rice type',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all rice types
const getRiceTypes = async (req, res) => {
    try {
        const [types] = await pool.query(
            'SELECT id, name, description, created_at FROM rice_types ORDER BY name ASC'
        );

        res.json({
            success: true,
            data: types
        });
    } catch (error) {
        console.error('Error fetching rice types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rice types'
        });
    }
};

// Get rice type by ID
const getRiceTypeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [types] = await pool.query(
            'SELECT id, name, description FROM rice_types WHERE id = ?',
            [id]
        );

        if (types.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice type not found'
            });
        }

        res.json({
            success: true,
            data: types[0]
        });
    } catch (error) {
        console.error('Error fetching rice type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rice type'
        });
    }
};

// Update rice type
const updateRiceType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Rice type name is required'
            });
        }

        // Check if new name already exists (excluding current type)
        const [existing] = await pool.query(
            'SELECT id FROM rice_types WHERE name = ? AND id != ?',
            [name.trim(), id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Rice type name already exists'
            });
        }

        const [result] = await pool.query(
            'UPDATE rice_types SET name = ?, description = ? WHERE id = ?',
            [name.trim(), description, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice type not found'
            });
        }

        res.json({
            success: true,
            message: 'Rice type updated successfully',
            data: { id, name: name.trim(), description }
        });
    } catch (error) {
        console.error('Error updating rice type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rice type'
        });
    }
};

// Delete rice type
const deleteRiceType = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if rice type is used by any rice variety
        const [used] = await pool.query(
            'SELECT id FROM rice_varieties WHERE rice_type = ? LIMIT 1',
            [id]
        );

        if (used.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete rice type. It is being used by one or more rice varieties.'
            });
        }

        const [result] = await pool.query(
            'DELETE FROM rice_types WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice type not found'
            });
        }

        res.json({
            success: true,
            message: 'Rice type deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting rice type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete rice type'
        });
    }
};

module.exports = {
    addRiceType,
    getRiceTypes,
    getRiceTypeById,
    updateRiceType,
    deleteRiceType
};