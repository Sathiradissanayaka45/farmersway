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

// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT * FROM customers 
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers'
        });
    }
};

// Get customer by ID with financial summary
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [customers] = await pool.query(
            'SELECT * FROM customers WHERE id = ?',
            [id]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const [payments] = await pool.query(
            'SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY payment_date DESC',
            [id]
        );

        const [purchases] = await pool.query(
            `SELECT rp.*, rv.name as rice_type_name 
             FROM rice_purchases rp
             JOIN rice_varieties rv ON rp.rice_type_id = rv.id
             WHERE rp.customer_id = ?
             ORDER BY rp.purchase_date DESC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...customers[0],
                payments,
                purchases
            }
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer details'
        });
    }
};

// Record a customer payment
// In customerController.js
const recordPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { amount, paymentMethod, referenceNumber, notes } = req.body;
        const customerId = req.params.id;
        const createdBy = req.user.id;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        // 1. Get all unpaid purchases for this customer (oldest first)
        const [purchases] = await connection.query(
            `SELECT id, pending_amount 
             FROM rice_purchases 
             WHERE customer_id = ? AND pending_amount > 0
             ORDER BY purchase_date ASC`,
            [customerId]
        );

        if (purchases.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer has no pending purchases'
            });
        }

        let remainingAmount = amount;
        const paymentDistribution = [];

        // 2. Distribute payment across purchases
        for (const purchase of purchases) {
            if (remainingAmount <= 0) break;

            const amountToApply = Math.min(remainingAmount, purchase.pending_amount);
            
            // Update purchase record
            await connection.query(
                `UPDATE rice_purchases 
                 SET paid_amount = paid_amount + ?,
                     pending_amount = pending_amount - ?
                 WHERE id = ?`,
                [amountToApply, amountToApply, purchase.id]
            );

            paymentDistribution.push({
                purchaseId: purchase.id,
                amountApplied: amountToApply,
                previousPending: purchase.pending_amount,
                newPending: purchase.pending_amount - amountToApply
            });

            remainingAmount -= amountToApply;
        }

        // 3. Record the payment in customer_payments table
        await connection.query(
            `INSERT INTO customer_payments 
            (customer_id, amount, payment_method, reference_number, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [customerId, amount, paymentMethod, referenceNumber, notes, createdBy]
        );

        // 4. Update customer financials
        await connection.query(
            `UPDATE customers 
             SET total_paid = total_paid + ?,
                 total_pending = total_pending - ?
             WHERE id = ?`,
            [amount, amount, customerId]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: {
                totalPaid: amount,
                remainingUnallocated: remainingAmount,
                paymentDistribution
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    recordPayment
};