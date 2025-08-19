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

// Create a new boiling record
const createBoilingRecord = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { rice_variety_id, quantity_kg } = req.body;
        const created_by = req.user.id;
        const boiling_date = new Date();

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

        // 2. Create boiling record
        const [result] = await connection.query(
            `INSERT INTO boiling_records 
            (rice_variety_id, quantity_kg, boiling_date, created_by)
            VALUES (?, ?, ?, ?)`,
            [rice_variety_id, quantity_kg, boiling_date, created_by]
        );

        // 3. Update rice stock
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
                `Sent ${quantity_kg}kg for boiling`,
                created_by
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Boiling record created successfully',
            data: {
                id: result.insertId,
                rice_variety_id,
                quantity_kg,
                boiling_date
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating boiling record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create boiling record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

const getAllBoilingRecords = async (req, res) => {
    try {
        const [records] = await pool.query(`
            SELECT 
                br.*, 
                rv.name as rice_variety_name, 
                u.username as created_by_name,
                IFNULL(SUM(bc.returned_quantity_kg), 0) as returned_quantity,
                IFNULL(SUM(bc.missing_quantity_kg), 0) as missing_quantity
            FROM boiling_records br
            JOIN rice_varieties rv ON br.rice_variety_id = rv.id
            JOIN admin_users u ON br.created_by = u.id
            LEFT JOIN boiling_completions bc ON br.id = bc.boiling_record_id
            WHERE br.bdeleted = FALSE
            GROUP BY br.id
            ORDER BY br.boiling_date DESC
        `);

        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching boiling records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch boiling records'
        });
    }
};

// Get completed boiling records
const getCompletedBoilingRecords = async (req, res) => {
    try {
const [records] = await pool.query(`
  SELECT 
    br.id as boiling_id,
    br.quantity_kg as sent_quantity,
    br.boiling_date,
    bc.returned_quantity_kg,
    bc.missing_quantity_kg,
    bc.cost_amount,
    bc.completion_date,
    bc.notes as completion_notes,
    rv.name as rice_variety_name,
    u1.username as created_by,
    u2.username as completed_by
  FROM boiling_completions bc
  JOIN boiling_records br ON bc.boiling_record_id = br.id
  JOIN rice_varieties rv ON br.rice_variety_id = rv.id
  JOIN admin_users u1 ON br.created_by = u1.id
  JOIN admin_users u2 ON bc.created_by = u2.id
  WHERE br.bdeleted = FALSE
  ORDER BY bc.completion_date DESC
`);

        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching completed boiling records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch completed boiling records'
        });
    }
};

// Get boiling record details with completion info
const getBoilingRecordDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Get the main boiling record
        const [boilingRecords] = await pool.query(`
            SELECT 
                br.*, 
                rv.name as rice_variety_name,
                u.username as created_by_name
            FROM boiling_records br
            JOIN rice_varieties rv ON br.rice_variety_id = rv.id
            JOIN admin_users u ON br.created_by = u.id
            WHERE br.id = ? AND br.bdeleted = FALSE
        `, [id]);

        if (boilingRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Boiling record not found'
            });
        }

        const boilingRecord = boilingRecords[0];

        // Get completion records if any
const [completions] = await pool.query(`
  SELECT 
    bc.*,
    u.username as completed_by_name
  FROM boiling_completions bc
  JOIN admin_users u ON bc.created_by = u.id
  WHERE bc.boiling_record_id = ?
  ORDER BY bc.completion_date DESC
`, [id]);

        // Get missing quantity details if any
        let missingDetails = [];
        if (completions.length > 0) {
            const [missingQuantities] = await pool.query(`
                SELECT * FROM boiling_missing_quantities
                WHERE boiling_completion_id = ?
                ORDER BY created_at DESC
            `, [completions[0].id]);
            missingDetails = missingQuantities;
        }

        res.json({
            success: true,
            data: {
                ...boilingRecord,
                completions,
                missing_quantities: missingDetails
            }
        });
    } catch (error) {
        console.error('Error fetching boiling record details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch boiling record details'
        });
    }
};

// Complete boiling process and return stock
const completeBoilingProcess = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { returned_quantity_kg, notes } = req.body;
        const created_by = req.user.id;
        const completion_date = new Date();

        // 1. Validate the boiling record
        const [boilingRecords] = await connection.query(
            `SELECT * FROM boiling_records 
             WHERE id = ? AND bdeleted = FALSE AND status = 'pending'`,
            [id]
        );

        if (boilingRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending boiling record not found or already completed'
            });
        }

        const boilingRecord = boilingRecords[0];

        // 2. Validate returned quantity
        if (returned_quantity_kg > boilingRecord.quantity_kg) {
            return res.status(400).json({
                success: false,
                message: 'Returned quantity cannot exceed sent quantity'
            });
        }

        const missing_quantity_kg = boilingRecord.quantity_kg - returned_quantity_kg;

        // 3. Create boiling completion record
const [completionResult] = await connection.query(
  `INSERT INTO boiling_completions 
  (boiling_record_id, returned_quantity_kg, missing_quantity_kg, 
   cost_amount, completion_date, notes, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [id, returned_quantity_kg, missing_quantity_kg, 
   req.body.cost_amount || null, completion_date, notes, created_by]
);

        // 4. Update boiling record status
        await connection.query(
            `UPDATE boiling_records 
             SET status = 'completed',
                 completed_at = ?
             WHERE id = ?`,
            [completion_date, id]
        );

        // 5. Update rice stock with returned quantity
        await connection.query(
            `UPDATE rice_varieties 
             SET current_stock_kg = current_stock_kg + ?
             WHERE id = ?`,
            [returned_quantity_kg, boilingRecord.rice_variety_id]
        );

        // 6. Record inventory adjustment
        const [currentStock] = await connection.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [boilingRecord.rice_variety_id]
        );

        await connection.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                boilingRecord.rice_variety_id, 
                +returned_quantity_kg, 
                currentStock[0].current_stock_kg, 
                currentStock[0].current_stock_kg + returned_quantity_kg,
                `Returned ${returned_quantity_kg}kg from boiling (record ID: ${id})`,
                created_by
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Boiling process completed successfully',
            data: {
                completion_id: completionResult.insertId,
                boiling_record_id: id,
                returned_quantity_kg,
                missing_quantity_kg
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error completing boiling process:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete boiling process',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Update missing quantity details
const updateMissingQuantityDetails = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { missing_details } = req.body;
        const created_by = req.user.id;

        // 1. Validate the boiling record is completed
        const [boilingRecords] = await connection.query(
            `SELECT * FROM boiling_records 
             WHERE id = ? AND bdeleted = FALSE AND status = 'completed'`,
            [id]
        );

        if (boilingRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Completed boiling record not found'
            });
        }

        // 2. Get the latest completion record
        const [completions] = await connection.query(
            `SELECT * FROM boiling_completions 
             WHERE boiling_record_id = ?
             ORDER BY completion_date DESC LIMIT 1`,
            [id]
        );

        if (completions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Completion record not found for this boiling'
            });
        }

        const completion = completions[0];

        // 3. Calculate total missing quantity from details
        const totalMissing = missing_details.reduce((sum, detail) => {
            return sum + parseFloat(detail.quantity_kg);
        }, 0);

        // 4. Validate total matches the completion record
        if (Math.abs(totalMissing - completion.missing_quantity_kg) > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Total missing quantity (${totalMissing}kg) doesn't match recorded missing quantity (${completion.missing_quantity_kg}kg)`
            });
        }

        // 5. Delete any existing missing quantity records
        await connection.query(
            'DELETE FROM boiling_missing_quantities WHERE boiling_completion_id = ?',
            [completion.id]
        );

        // 6. Insert new missing quantity records
        for (const detail of missing_details) {
            await connection.query(
                `INSERT INTO boiling_missing_quantities 
                (boiling_completion_id, quantity_kg, reason, description)
                VALUES (?, ?, ?, ?)`,
                [completion.id, detail.quantity_kg, detail.reason, detail.description]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Missing quantity details updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating missing quantity details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update missing quantity details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Delete boiling record (updated to check status)
const deleteBoilingRecord = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const deleted_by = req.user.id;
        const deleted_at = new Date();

        // 1. Get the boiling record - only allow deletion if pending
        const [records] = await connection.query(
            'SELECT * FROM boiling_records WHERE id = ? AND bdeleted = FALSE AND status = "pending"',
            [id]
        );

        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending boiling record not found or already completed/deleted'
            });
        }

        const record = records[0];

        // 2. Update the record as deleted
        await connection.query(
            `UPDATE boiling_records 
             SET bdeleted = TRUE,
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
                `Cancelled boiling of ${record.quantity_kg}kg (record ID: ${id})`,
                deleted_by
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Boiling record cancelled successfully and stock adjusted'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting boiling record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete boiling record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};
// Get boiling completion records
const getBoilingCompletions = async (req, res) => {
    try {
        const { id } = req.params;

        const [completions] = await pool.query(`
            SELECT 
                bc.*,
                u.username as completed_by_name
            FROM boiling_completions bc
            JOIN admin_users u ON bc.created_by = u.id
            WHERE bc.boiling_record_id = ?
            ORDER BY bc.completion_date DESC
        `, [id]);

        res.json({
            success: true,
            data: completions
        });
    } catch (error) {
        console.error('Error fetching boiling completions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch boiling completions'
        });
    }
};
const getMissingQuantities = async (req, res) => {
    try {
        const { id } = req.params;
        const { completion_id } = req.query;

        const [missingQuantities] = await pool.query(`
            SELECT * FROM boiling_missing_quantities
            WHERE boiling_completion_id = ?
            ORDER BY created_at DESC
        `, [completion_id]);

        res.json({
            success: true,
            data: missingQuantities
        });
    } catch (error) {
        console.error('Error fetching missing quantities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch missing quantities'
        });
    }
};

module.exports = {
    createBoilingRecord,
    getAllBoilingRecords,
    getCompletedBoilingRecords,
    getBoilingRecordDetails,
    deleteBoilingRecord,
    completeBoilingProcess,
    updateMissingQuantityDetails,
    getBoilingCompletions,
    getMissingQuantities
};