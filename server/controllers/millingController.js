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

// Create a new milling record
const createMillingRecord = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { rice_variety_id, quantity_kg } = req.body;
        const created_by = req.user.id;
        const milling_date = new Date();

        // 1. Check rice stock availability
        const [riceStock] = await connection.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [rice_variety_id]
        );

        if (riceStock.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        // if (riceStock[0].current_stock_kg < quantity_kg) {
        //     return res.status(400).json({
        //         success: false,
        //         message: `Insufficient stock. Available: ${riceStock[0].current_stock_kg}kg`
        //     });
        // }

        // 2. Create milling record
        const [result] = await connection.query(
            `INSERT INTO milling_records 
            (rice_variety_id, quantity_kg, milling_date, created_by)
            VALUES (?, ?, ?, ?)`,
            [rice_variety_id, quantity_kg, milling_date, created_by]
        );

        // 3. Update rice stock (remove the sent quantity)
        await connection.query(
            `UPDATE rice_varieties 
             SET current_stock_kg = current_stock_kg - ?
             WHERE id = ?`,
            [quantity_kg, rice_variety_id]
        );

        // 4. Record inventory adjustment
        await connection.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                rice_variety_id, 
                -quantity_kg, 
                riceStock[0].current_stock_kg, 
                riceStock[0].current_stock_kg - quantity_kg,
                `Sent ${quantity_kg}kg for milling`,
                created_by
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Milling record created successfully',
            data: {
                id: result.insertId,
                rice_variety_id,
                quantity_kg,
                milling_date
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating milling record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create milling record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Get all milling records
const getAllMillingRecords = async (req, res) => {
    try {
        const [records] = await pool.query(`
            SELECT 
                mr.*, 
                rv.name as rice_variety_name, 
                u.username as created_by_name,
                IFNULL(mc.returned_quantity_kg, 0) as returned_quantity
            FROM milling_records mr
            JOIN rice_varieties rv ON mr.rice_variety_id = rv.id
            JOIN admin_users u ON mr.created_by = u.id
            LEFT JOIN (
                SELECT milling_record_id, SUM(returned_quantity_kg) as returned_quantity_kg
                FROM milling_completions
                GROUP BY milling_record_id
            ) mc ON mr.id = mc.milling_record_id
            WHERE mr.mdeleted = FALSE
            ORDER BY mr.milling_date DESC
        `);

        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching milling records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch milling records'
        });
    }
};

// Get completed milling records
const getCompletedMillingRecords = async (req, res) => {
    try {
        const [records] = await pool.query(`
            SELECT 
                mr.id as milling_id,
                mr.quantity_kg as sent_quantity,
                mr.milling_date,
                mc.returned_quantity_kg,
                mc.completion_date,
                mc.notes as completion_notes,
                rv1.name as input_rice_variety_name,
                rv2.name as output_rice_variety_name,
                u1.username as created_by,
                u2.username as completed_by
            FROM milling_completions mc
            JOIN milling_records mr ON mc.milling_record_id = mr.id
            JOIN rice_varieties rv1 ON mr.rice_variety_id = rv1.id
            JOIN rice_varieties rv2 ON mc.output_rice_variety_id = rv2.id
            JOIN admin_users u1 ON mr.created_by = u1.id
            JOIN admin_users u2 ON mc.created_by = u2.id
            WHERE mr.mdeleted = FALSE
            ORDER BY mc.completion_date DESC
        `);

        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching completed milling records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch completed milling records'
        });
    }
};

// Get milling record by ID
const getMillingRecordById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get the main milling record
        const [millingRecords] = await pool.query(`
            SELECT 
                mr.*, 
                rv.name as rice_variety_name,
                u.username as created_by_name
            FROM milling_records mr
            JOIN rice_varieties rv ON mr.rice_variety_id = rv.id
            JOIN admin_users u ON mr.created_by = u.id
            WHERE mr.id = ? AND mr.mdeleted = FALSE
        `, [id]);

        if (millingRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Milling record not found'
            });
        }

        const millingRecord = millingRecords[0];

        // Get completion records if any
        const [completions] = await pool.query(`
            SELECT 
                mc.*,
                rv.name as output_rice_variety_name,
                u.username as completed_by_name
            FROM milling_completions mc
            JOIN rice_varieties rv ON mc.output_rice_variety_id = rv.id
            JOIN admin_users u ON mc.created_by = u.id
            WHERE mc.milling_record_id = ?
            ORDER BY mc.completion_date DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...millingRecord,
                completions
            }
        });
    } catch (error) {
        console.error('Error fetching milling record details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch milling record details'
        });
    }
};

// Complete milling process
const completeMillingProcess = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { output_rice_variety_id, returned_quantity_kg, notes } = req.body;
        const created_by = req.user.id;
        const completion_date = new Date();

        // 1. Validate the milling record
        const [millingRecords] = await connection.query(
            `SELECT * FROM milling_records 
             WHERE id = ? AND mdeleted = FALSE AND status = 'pending'`,
            [id]
        );

        if (millingRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending milling record not found or already completed'
            });
        }

        const millingRecord = millingRecords[0];

        // 2. Validate output rice variety exists
        const [riceVarieties] = await connection.query(
            'SELECT id FROM rice_varieties WHERE id = ?',
            [output_rice_variety_id]
        );

        if (riceVarieties.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Output rice variety not found'
            });
        }

        // 3. Create milling completion record
        const [completionResult] = await connection.query(
            `INSERT INTO milling_completions 
            (milling_record_id, output_rice_variety_id, returned_quantity_kg, 
             completion_date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [id, output_rice_variety_id, returned_quantity_kg, 
             completion_date, notes, created_by]
        );

        // 4. Update milling record status
        await connection.query(
            `UPDATE milling_records 
             SET status = 'completed',
                 completed_at = ?
             WHERE id = ?`,
            [completion_date, id]
        );

        // 5. Update rice stock with returned quantity (add to output variety)
        await connection.query(
            `UPDATE rice_varieties 
             SET current_stock_kg = current_stock_kg + ?
             WHERE id = ?`,
            [returned_quantity_kg, output_rice_variety_id]
        );

        // 6. Record inventory adjustment for output variety
        const [currentStock] = await connection.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [output_rice_variety_id]
        );

        await connection.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                output_rice_variety_id, 
                +returned_quantity_kg, 
                currentStock[0].current_stock_kg, 
                currentStock[0].current_stock_kg + returned_quantity_kg,
                `Received ${returned_quantity_kg}kg from milling (record ID: ${id})`,
                created_by
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Milling process completed successfully',
            data: {
                completion_id: completionResult.insertId,
                milling_record_id: id,
                output_rice_variety_id,
                returned_quantity_kg
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error completing milling process:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete milling process',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Delete milling record
const deleteMillingRecord = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const deleted_by = req.user.id;
        const deleted_at = new Date();

        // 1. Get the milling record - only allow deletion if pending
        const [records] = await connection.query(
            'SELECT * FROM milling_records WHERE id = ? AND mdeleted = FALSE AND status = "pending"',
            [id]
        );

        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending milling record not found or already completed/deleted'
            });
        }

        const record = records[0];

        // 2. Update the record as deleted
        await connection.query(
            `UPDATE milling_records 
             SET mdeleted = TRUE,
                 status = 'cancelled',
                 deleted_by = ?,
                 deleted_at = ?
             WHERE id = ?`,
            [deleted_by, deleted_at, id]
        );

        // 3. Restore the stock
        await connection.query(
            `UPDATE rice_varieties 
             SET current_stock_kg = current_stock_kg + ?
             WHERE id = ?`,
            [record.quantity_kg, record.rice_variety_id]
        );

        // 4. Record inventory adjustment
        const [currentStock] = await connection.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [record.rice_variety_id]
        );

        await connection.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                record.rice_variety_id, 
                +record.quantity_kg, 
                currentStock[0].current_stock_kg, 
                currentStock[0].current_stock_kg + record.quantity_kg,
                `Cancelled milling of ${record.quantity_kg}kg (record ID: ${id})`,
                deleted_by
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Milling record cancelled successfully and stock adjusted'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting milling record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete milling record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    createMillingRecord,
    getAllMillingRecords,
    getCompletedMillingRecords,
    getMillingRecordById,
    completeMillingProcess,
    deleteMillingRecord
};