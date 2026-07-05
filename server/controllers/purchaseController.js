// controllers/purchaseController.js - CORRECTED VERSION
const mysql = require('mysql2/promise');
const { format } = require('date-fns');
require('dotenv').config();
const { recordPurchaseAccounting, recordPaymentMadeAccounting } = require('../middleware/accountingIntegration');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});



const getOrCreateCustomerAccount = async (connection, customerId, customerName) => {
    try {
        // Check if customer account already exists
        const [existingAccount] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN customers c ON ca.id = c.account_id
             WHERE c.id = ?`,
            [customerId]
        );

        if (existingAccount.length > 0) {
            return existingAccount[0].id;
        }

        // Create new account for customer (Accounts Receivable - Customer)
        const accountCode = `AR-CUST-${String(customerId).padStart(5, '0')}`;
        const accountName = `Accounts Receivable - ${customerName}`;

        const [result] = await connection.query(
            `INSERT INTO chart_of_accounts 
            (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
            SELECT ?, ?, at.id, ?, 0, 0, 1
            FROM account_types at
            WHERE at.category = 'asset' AND at.name LIKE '%Receivable%'
            LIMIT 1`,
            [accountCode, accountName, `Receivable from customer ${customerName}`]
        );

        const accountId = result.insertId;

        // Update customer with account_id
        await connection.query(
            'UPDATE customers SET account_id = ? WHERE id = ?',
            [accountId, customerId]
        );

        return accountId;
    } catch (error) {
        console.error('Error creating customer account:', error);
        throw error;
    }
};

// Create a new purchase
const createPurchase = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            customerName, 
            phone, 
            riceTypeId, 
            riceVarietyId,
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

        const finalRiceId = riceVarietyId || riceTypeId;
        
        if (!finalRiceId) {
            return res.status(400).json({
                success: false,
                message: 'Rice variety or type is required'
            });
        }

        // Check rice variety exists
        const [riceVariety] = await connection.query(
            'SELECT id, name, current_stock_kg, rice_type FROM rice_varieties WHERE id = ?',
            [finalRiceId]
        );

        if (riceVariety.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        const riceTypeIdFromVariety = riceVariety[0].rice_type;

        // Check if customer exists by phone
        const [customerRows] = await connection.query(
            'SELECT id, name FROM customers WHERE phone = ?',
            [phone]
        );

        let customerId;
        if (customerRows.length > 0) {
            customerId = customerRows[0].id;
            // Update customer's rice variety if not set
            await connection.query(
                'UPDATE customers SET rice_variety_id = COALESCE(rice_variety_id, ?) WHERE id = ?',
                [finalRiceId, customerId]
            );
        } else {
            // Create new customer with rice variety
            const [result] = await connection.query(
                'INSERT INTO customers (name, phone, rice_variety_id) VALUES (?, ?, ?)',
                [customerName, phone, finalRiceId]
            );
            customerId = result.insertId;
        }

        // Get or create customer account
        const customerAccountId = await getOrCreateCustomerAccount(connection, customerId, customerName);

        // Create purchase record
        const [purchaseResult] = await connection.query(
            `INSERT INTO rice_purchases 
            (customer_id, rice_type_id, rice_variety_id, quantity_kg, unit_price, total_price, 
             paid_amount, pending_amount, purchase_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customerId, riceTypeIdFromVariety, finalRiceId, quantityKg, unitPrice, totalPrice, 
             paidAmount, pendingAmount, purchaseDate, createdBy]
        );

        // Update customer purchase details
        await connection.query(
            `INSERT INTO customer_purchase_details 
            (customer_id, rice_variety_id, total_quantity_kg, total_amount, last_purchase_date)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            total_quantity_kg = total_quantity_kg + VALUES(total_quantity_kg),
            total_amount = total_amount + VALUES(total_amount),
            last_purchase_date = VALUES(last_purchase_date)`,
            [customerId, finalRiceId, quantityKg, totalPrice, purchaseDate]
        );

        // Update customer financials
        await connection.query(
            `UPDATE customers 
             SET total_purchases = total_purchases + ?,
                 total_paid = total_paid + ?,
                 total_pending = total_pending + ?
             WHERE id = ?`,
            [totalPrice, paidAmount, pendingAmount, customerId]
        );

        // Update rice inventory
        await connection.query(
            `UPDATE rice_varieties 
             SET current_stock_kg = current_stock_kg + ?
             WHERE id = ?`,
            [quantityKg, finalRiceId]
        );

        // Record inventory adjustment
        await connection.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                finalRiceId, 
                +quantityKg, 
                riceVariety[0].current_stock_kg, 
                riceVariety[0].current_stock_kg + quantityKg,
                `Purchase: ${quantityKg}kg from ${customerName} (${phone})`,
                createdBy
            ]
        );

        // Record payment if any amount was paid
        if (paidAmount > 0) {
            await connection.query(
                `INSERT INTO customer_payments 
                (customer_id, amount, payment_method, reference_number, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [customerId, paidAmount, paymentMethod, referenceNumber, notes, createdBy]
            );
        }

        await connection.commit();

        // Create journal entry for the purchase AFTER commit
        // We need to do this outside the transaction to avoid deadlocks
        try {
            await recordPurchaseAccounting({
                purchaseId: purchaseResult.insertId,
                customerId,
                customerName,
                quantityKg,
                totalPrice,
                paidAmount,
                pendingAmount,
                paymentMethod,
                referenceNumber,
                notes
            }, createdBy, customerAccountId);
        } catch (accountingError) {
            console.error('Accounting entry creation failed:', accountingError);
            // Don't fail the purchase if accounting fails, just log it
        }

        res.status(201).json({
            success: true,
            message: 'Purchase recorded successfully',
            data: {
                purchaseId: purchaseResult.insertId,
                customerId,
                totalPrice,
                pendingAmount,
                riceVarietyName: riceVariety[0].name
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


// Get all purchases with customer and rice type details (CORRECTED QUERY)
const getAllPurchases = async (req, res) => {
    try {
        const [purchases] = await pool.query(`
            SELECT 
                rp.id, 
                rp.quantity_kg, 
                rp.unit_price, 
                rp.total_price,
                rp.paid_amount, 
                rp.pending_amount, 
                rp.purchase_date,
                c.id as customer_id, 
                c.name as customer_name, 
                c.phone,
                COALESCE(rv.id, rp.rice_type_id) as rice_variety_id,
                COALESCE(rv.name, 'Unknown Rice') as rice_variety_name,
                COALESCE(rt.id, rp.rice_type_id) as rice_type_id,
                COALESCE(rt.name, 'Unknown Type') as rice_type_name,
                u.username as created_by
            FROM rice_purchases rp
            JOIN customers c ON rp.customer_id = c.id
            LEFT JOIN rice_varieties rv ON COALESCE(rp.rice_variety_id, rp.rice_type_id) = rv.id
            LEFT JOIN rice_types rt ON COALESCE(rv.rice_type, rp.rice_type_id) = rt.id
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
            message: 'Failed to fetch purchases',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get purchases by customer (CORRECTED QUERY)
const getPurchasesByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const [purchases] = await pool.query(`
            SELECT 
                rp.id, 
                rp.quantity_kg, 
                rp.unit_price, 
                rp.total_price,
                rp.paid_amount, 
                rp.pending_amount, 
                rp.purchase_date,
                COALESCE(rv.name, 'Unknown Rice') as rice_variety_name,
                COALESCE(rt.name, 'Unknown Type') as rice_type_name
            FROM rice_purchases rp
            LEFT JOIN rice_varieties rv ON COALESCE(rp.rice_variety_id, rp.rice_type_id) = rv.id
            LEFT JOIN rice_types rt ON COALESCE(rv.rice_type, rp.rice_type_id) = rt.id
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

// Get customers with their rice variety details (CORRECTED QUERY)
const getAllCustomers = async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT 
                c.id, 
                c.name, 
                c.phone, 
                c.total_purchases, 
                c.total_paid, 
                c.total_pending,
                rv.id as rice_variety_id, 
                rv.name as rice_variety_name,
                rt.name as rice_type_name,
                COALESCE(cpd.total_quantity_kg, 0) as total_quantity_kg,
                COALESCE(cpd.total_amount, 0) as total_amount,
                cpd.last_purchase_date
            FROM customers c
            LEFT JOIN rice_varieties rv ON c.rice_variety_id = rv.id
            LEFT JOIN rice_types rt ON rv.rice_type = rt.id
            LEFT JOIN customer_purchase_details cpd ON c.id = cpd.customer_id 
                AND (c.rice_variety_id = cpd.rice_variety_id)
            ORDER BY c.name ASC
        `);

        // Group customers and their rice purchases
        const customerMap = {};
        customers.forEach(customer => {
            if (!customerMap[customer.id]) {
                customerMap[customer.id] = {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    total_purchases: parseFloat(customer.total_purchases) || 0,
                    total_paid: parseFloat(customer.total_paid) || 0,
                    total_pending: parseFloat(customer.total_pending) || 0,
                    primary_rice_variety: customer.rice_variety_name,
                    primary_rice_type: customer.rice_type_name,
                    primary_rice_variety_id: customer.rice_variety_id,
                    purchases_by_rice: []
                };
            }
            
            if (customer.rice_variety_id && customer.total_quantity_kg > 0) {
                // Check if this rice variety already exists in purchases_by_rice
                const existingIndex = customerMap[customer.id].purchases_by_rice.findIndex(
                    p => p.rice_variety_id === customer.rice_variety_id
                );
                
                if (existingIndex === -1) {
                    customerMap[customer.id].purchases_by_rice.push({
                        rice_variety_id: customer.rice_variety_id,
                        rice_variety_name: customer.rice_variety_name,
                        rice_type_name: customer.rice_type_name,
                        total_quantity_kg: parseFloat(customer.total_quantity_kg) || 0,
                        total_amount: parseFloat(customer.total_amount) || 0,
                        last_purchase_date: customer.last_purchase_date ? 
                            format(new Date(customer.last_purchase_date), 'yyyy-MM-dd HH:mm:ss') : 
                            null
                    });
                }
            }
        });

        const formattedCustomers = Object.values(customerMap);

        res.json({
            success: true,
            data: formattedCustomers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get detailed customer purchase statistics (CORRECTED QUERY)
const getCustomerPurchaseStats = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const [stats] = await pool.query(`
            SELECT 
                cpd.rice_variety_id,
                rv.name as rice_variety_name,
                rt.name as rice_type_name,
                COALESCE(cpd.total_quantity_kg, 0) as total_quantity_kg,
                COALESCE(cpd.total_amount, 0) as total_amount,
                cpd.last_purchase_date,
                COUNT(rp.id) as total_purchases
            FROM customer_purchase_details cpd
            JOIN rice_varieties rv ON cpd.rice_variety_id = rv.id
            JOIN rice_types rt ON rv.rice_type = rt.id
            LEFT JOIN rice_purchases rp ON cpd.customer_id = rp.customer_id 
                AND cpd.rice_variety_id = COALESCE(rp.rice_variety_id, rp.rice_type_id)
            WHERE cpd.customer_id = ?
            GROUP BY cpd.rice_variety_id, cpd.customer_id
            ORDER BY cpd.total_quantity_kg DESC
        `, [customerId]);

        // Format the stats
        const formattedStats = stats.map(stat => ({
            ...stat,
            total_quantity_kg: parseFloat(stat.total_quantity_kg) || 0,
            total_amount: parseFloat(stat.total_amount) || 0,
            last_purchase_date: stat.last_purchase_date ? 
                format(new Date(stat.last_purchase_date), 'yyyy-MM-dd HH:mm:ss') : 
                null
        }));

        res.json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Error fetching customer purchase stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer purchase statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// controllers/purchaseController.js - Updated recordOrderPayment with better debugging

const recordOrderPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { purchaseId } = req.params;
        const { amount, paymentMethod = 'cash', referenceNumber, notes } = req.body;
        const createdBy = req.user.id;

        console.log('========== PAYMENT DEBUG START ==========');
        console.log('1. Received payment request:', {
            purchaseId,
            amount,
            paymentMethod,
            referenceNumber,
            notes,
            createdBy
        });

        // 1. Get purchase details to validate
        const [purchaseRows] = await connection.query(
            `SELECT rp.*, c.name as customer_name, c.account_id as customer_account_id
             FROM rice_purchases rp
             JOIN customers c ON rp.customer_id = c.id
             WHERE rp.id = ?`,
            [purchaseId]
        );

        if (purchaseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        const purchase = purchaseRows[0];
        console.log('2. Found purchase:', {
            id: purchase.id,
            customer_id: purchase.customer_id,
            customer_name: purchase.customer_name,
            pending_amount: purchase.pending_amount,
            paid_amount: purchase.paid_amount
        });
        
        // Validate payment amount doesn't exceed pending amount
        if (amount > purchase.pending_amount) {
            return res.status(400).json({
                success: false,
                message: `Payment amount exceeds pending amount (Max: ${purchase.pending_amount})`
            });
        }

        // 2. Record payment in customer_payments table
        const [paymentResult] = await connection.query(
            `INSERT INTO customer_payments 
            (customer_id, amount, payment_method, reference_number, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [purchase.customer_id, amount, paymentMethod, referenceNumber, notes, createdBy]
        );

        console.log('3. Payment recorded with ID:', paymentResult.insertId);

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
        console.log('4. Database transaction committed successfully');

        // 5. Create journal entry for the payment
        console.log('5. Attempting to create journal entry...');
        try {
            const paymentData = {
                paymentId: paymentResult.insertId,
                purchaseId: purchaseId,
                supplierId: purchase.customer_id,
                supplierName: purchase.customer_name,
                amount: parseFloat(amount),
                paymentMethod: paymentMethod,
                referenceNumber: referenceNumber || null,
                notes: notes || null
            };
            console.log('   Payment data for accounting:', JSON.stringify(paymentData, null, 2));
            
            await recordPaymentMadeAccounting(paymentData, createdBy);
            console.log('6. Journal entry creation completed');
        } catch (accountingError) {
            console.error('   ERROR in journal entry creation:', accountingError);
            // Don't fail the payment if accounting fails, just log it
        }

        console.log('========== PAYMENT DEBUG END ==========');

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

const recordCustomerPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { customerId } = req.params;
        const { amount, paymentMethod = 'cash', referenceNumber, notes } = req.body;
        const createdBy = req.user.id;

        // 1. Get customer details
        const [customerRows] = await connection.query(
            'SELECT id, name, total_pending FROM customers WHERE id = ?',
            [customerId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const customer = customerRows[0];
        
        // Validate payment amount doesn't exceed total pending
        if (amount > customer.total_pending) {
            return res.status(400).json({
                success: false,
                message: `Payment amount exceeds total pending amount (Max: ${customer.total_pending})`
            });
        }

        // 2. Record payment in customer_payments table
        const [paymentResult] = await connection.query(
            `INSERT INTO customer_payments 
            (customer_id, amount, payment_method, reference_number, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [customerId, amount, paymentMethod, referenceNumber, notes, createdBy]
        );

        // 3. Get all pending purchases for this customer (FIFO approach)
        const [pendingPurchases] = await connection.query(
            `SELECT id, pending_amount 
             FROM rice_purchases 
             WHERE customer_id = ? AND pending_amount > 0 
             ORDER BY purchase_date ASC`,
            [customerId]
        );

        let remainingAmount = amount;
        
        // 4. Apply payment to oldest purchases first
        for (const purchase of pendingPurchases) {
            if (remainingAmount <= 0) break;
            
            const paymentToApply = Math.min(remainingAmount, purchase.pending_amount);
            
            await connection.query(
                `UPDATE rice_purchases 
                 SET paid_amount = paid_amount + ?,
                     pending_amount = pending_amount - ?
                 WHERE id = ?`,
                [paymentToApply, paymentToApply, purchase.id]
            );
            
            remainingAmount -= paymentToApply;
        }

        // 5. Update customer financials
        await connection.query(
            `UPDATE customers 
             SET total_paid = total_paid + ?,
                 total_pending = total_pending - ?
             WHERE id = ?`,
            [amount, amount, customerId]
        );

        await connection.commit();

        // 6. Create journal entry for the payment
        try {
            await recordPaymentMadeAccounting({
                paymentId: paymentResult.insertId,
                supplierId: customerId,
                supplierName: customer.name,
                amount: amount,
                paymentMethod: paymentMethod,
                referenceNumber: referenceNumber,
                notes: notes
            }, createdBy);
        } catch (accountingError) {
            console.error('Accounting entry creation failed:', accountingError);
        }

        res.status(201).json({
            success: true,
            message: 'Customer payment recorded successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording customer payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record customer payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};


// Get customer details by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [customers] = await pool.query(`
            SELECT 
                c.id, c.name, c.phone, 
                c.total_purchases, c.total_paid, c.total_pending,
                rv.id as rice_variety_id, rv.name as rice_variety_name,
                rt.name as rice_type_name
            FROM customers c
            LEFT JOIN rice_varieties rv ON c.rice_variety_id = rv.id
            LEFT JOIN rice_types rt ON rv.rice_type = rt.id
            WHERE c.id = ?
        `, [id]);

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customers[0]
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer details'
        });
    }
};

module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchasesByCustomer,
    getAllCustomers,
    getCustomerPurchaseStats,
    recordOrderPayment,
    getCustomerById,
    recordCustomerPayment,
};