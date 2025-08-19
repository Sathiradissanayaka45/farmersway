const mysql = require('mysql2/promise');
const { format } = require('date-fns');
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

// Create a new purchase
const createPurchase = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            customerName, 
            phone, 
            riceTypeId, 
            quantityKg, 
            unitPrice, 
            paidAmount,
            paymentMethod = 'cash',
            referenceNumber,
            notes
        } = req.body;
        
        const createdBy = req.user.id;
        const totalPrice = quantityKg * unitPrice;
        const pendingAmount = totalPrice - paidAmount;
        const purchaseDate = new Date();

        // 1. Check rice stock availability
        const [riceStock] = await connection.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [riceTypeId]
        );

        if (riceStock.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        // if (riceStock[0].current_stock_kg < quantityKg) {
        //     return res.status(400).json({
        //         success: false,
        //         message: `Insufficient stock. Available: ${riceStock[0].current_stock_kg}kg`
        //     });
        // }

        // 2. Check if customer exists
        const [customerRows] = await connection.query(
            'SELECT id FROM customers WHERE phone = ?',
            [phone]
        );

        let customerId;
        if (customerRows.length > 0) {
            customerId = customerRows[0].id;
        } else {
            // Create new customer
            const [result] = await connection.query(
                'INSERT INTO customers (name, phone) VALUES (?, ?)',
                [customerName, phone]
            );
            customerId = result.insertId;
        }

        // 3. Create purchase record
        const [purchaseResult] = await connection.query(
            `INSERT INTO rice_purchases 
            (customer_id, rice_type_id, quantity_kg, unit_price, total_price, 
             paid_amount, pending_amount, purchase_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customerId, riceTypeId, quantityKg, unitPrice, totalPrice, 
             paidAmount, pendingAmount, purchaseDate, createdBy]
        );

        // 4. Update customer financials
        await connection.query(
            `UPDATE customers 
             SET total_purchases = total_purchases + ?,
                 total_paid = total_paid + ?,
                 total_pending = total_pending + ?
             WHERE id = ?`,
            [totalPrice, paidAmount, pendingAmount, customerId]
        );

        // 5. Update rice inventory
        await connection.query(
            `UPDATE rice_varieties 
             SET current_stock_kg = current_stock_kg + ?
             WHERE id = ?`,
            [quantityKg, riceTypeId]
        );

        // 6. Record inventory adjustment
        await connection.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                riceTypeId, 
                +quantityKg, 
                riceStock[0].current_stock_kg, 
                riceStock[0].current_stock_kg - quantityKg,
                `Buy ${quantityKg}kg from customer ${customerId}`,
                createdBy
            ]
        );

        // 7. Record payment if any amount was paid
        if (paidAmount > 0) {
            await connection.query(
                `INSERT INTO customer_payments 
                (customer_id, amount, payment_method, reference_number, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [customerId, paidAmount, paymentMethod, referenceNumber, notes, createdBy]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Purchase recorded successfully',
            data: {
                purchaseId: purchaseResult.insertId,
                customerId,
                totalPrice,
                pendingAmount
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record purchase',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Get all purchases with customer and rice type details
const getAllPurchases = async (req, res) => {
    try {
        const [purchases] = await pool.query(`
            SELECT 
                rp.id, rp.quantity_kg, rp.unit_price, rp.total_price,
                rp.paid_amount, rp.pending_amount, rp.purchase_date,
                c.id as customer_id, c.name as customer_name, c.phone,
                rv.id as rice_type_id, rv.name as rice_type_name,
                u.username as created_by
            FROM rice_purchases rp
            JOIN customers c ON rp.customer_id = c.id
            JOIN rice_varieties rv ON rp.rice_type_id = rv.id
            LEFT JOIN admin_users u ON rp.created_by = u.id
            ORDER BY rp.purchase_date DESC
        `);

        const formattedPurchases = purchases.map(purchase => ({
            ...purchase,
            purchase_date: format(new Date(purchase.purchase_date), 'yyyy-MM-dd HH:mm:ss')
        }));

        res.json({
            success: true,
            data: formattedPurchases
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchases'
        });
    }
};

// Get purchases by customer
const getPurchasesByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const [purchases] = await pool.query(`
            SELECT 
                rp.id, rp.quantity_kg, rp.unit_price, rp.total_price,
                rp.paid_amount, rp.pending_amount, rp.purchase_date,
                rv.name as rice_type_name
            FROM rice_purchases rp
            JOIN rice_varieties rv ON rp.rice_type_id = rv.id
            WHERE rp.customer_id = ?
            ORDER BY rp.purchase_date DESC
        `, [customerId]);

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error('Error fetching customer purchases:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer purchases'
        });
    }
};
// In purchaseController.js
const recordOrderPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { purchaseId } = req.params;
        const { amount, paymentMethod = 'cash', referenceNumber, notes } = req.body;
        const createdBy = req.user.id;

        // 1. Get purchase details to validate
        const [purchaseRows] = await connection.query(
            'SELECT * FROM rice_purchases WHERE id = ?',
            [purchaseId]
        );

        if (purchaseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        const purchase = purchaseRows[0];
        
        // Validate payment amount doesn't exceed pending amount
        if (amount > purchase.pending_amount) {
            return res.status(400).json({
                success: false,
                message: `Payment amount exceeds pending amount (Max: ${purchase.pending_amount})`
            });
        }

        // 2. Record payment in customer_payments table
        await connection.query(
            `INSERT INTO customer_payments 
            (customer_id, amount, payment_method, reference_number, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [purchase.customer_id, amount, paymentMethod, referenceNumber, notes, createdBy]
        );

        // 3. Update the rice_purchases table
        await connection.query(
            `UPDATE rice_purchases 
             SET paid_amount = paid_amount + ?,
                 pending_amount = pending_amount - ?
             WHERE id = ?`,
            [amount, amount, purchaseId]
        );

        // 4. Update customer financials
        await connection.query(
            `UPDATE customers 
             SET total_paid = total_paid + ?,
                 total_pending = total_pending - ?
             WHERE id = ?`,
            [amount, amount, purchase.customer_id]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully for the order'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording order payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record payment for the order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchasesByCustomer,
    recordOrderPayment
};