// routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const { 
    createPurchase,
    getAllPurchases,
    getPurchasesByCustomer,
    getAllCustomers,
    getCustomerPurchaseStats,
    recordOrderPayment,
    recordCustomerPayment,  // Add this import
    getCustomerById
} = require('../controllers/purchaseController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
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

// Purchase routes
router.post('/', authMiddleware, adminOnly, createPurchase);
router.get('/', authMiddleware, getAllPurchases);
router.get('/customers', authMiddleware, getAllCustomers); // Get all customers with details
router.get('/customer/:customerId', authMiddleware, getPurchasesByCustomer); // Get purchases by customer
router.get('/customer/:customerId/stats', authMiddleware, getCustomerPurchaseStats); // Get customer statistics

// Payment routes - FIXED: Remove duplicate
router.post('/:purchaseId/payments', authMiddleware, recordOrderPayment); // Record payment for specific purchase
router.post('/customers/:customerId/payments', authMiddleware, recordCustomerPayment); // Record general customer payment

router.get('/customers/:id', authMiddleware, getCustomerById);

// Get customer payment history
router.get('/customers/:customerId/payments', authMiddleware, async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const [payments] = await pool.query(
            `SELECT cp.*, u.username as recorded_by_name,
                    rp.id as purchase_id
             FROM customer_payments cp
             LEFT JOIN rice_purchases rp ON cp.purchase_id = rp.id
             LEFT JOIN admin_users u ON cp.created_by = u.id
             WHERE cp.customer_id = ?
             ORDER BY cp.payment_date DESC`,
            [customerId]
        );
        
        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching customer payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer payments'
        });
    }
});

module.exports = router;