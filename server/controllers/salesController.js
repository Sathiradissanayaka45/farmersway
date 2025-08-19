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

// Create a new selling customer
const createSellingCustomer = async (req, res) => {
    try {
        const { name, phone, address, customer_type = 'retail' } = req.body;
        
        // Basic validation
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name and phone are required'
            });
        }

        // Check if customer already exists
        const [existing] = await pool.query(
            'SELECT id FROM selling_customers WHERE phone = ?',
            [phone]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer with this phone already exists'
            });
        }

        // Insert new customer
        const [result] = await pool.query(
            'INSERT INTO selling_customers (name, phone, address, customer_type) VALUES (?, ?, ?, ?)',
            [name, phone, address || null, customer_type]
        );

        res.status(201).json({
            success: true,
            message: 'Selling customer created successfully',
            data: {
                id: result.insertId,
                name,
                phone,
                customer_type
            }
        });
    } catch (error) {
        console.error('Error creating selling customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create selling customer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all selling customers
const getAllSellingCustomers = async (req, res) => {
    try {
        const [customers] = await pool.query(
            'SELECT * FROM selling_customers ORDER BY name ASC'
        );

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error fetching selling customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch selling customers'
        });
    }
};

// Get selling customer by ID
const getSellingCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const [customers] = await pool.query(
            'SELECT * FROM selling_customers WHERE id = ?',
            [id]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Selling customer not found'
            });
        }

        res.json({
            success: true,
            data: customers[0]
        });
    } catch (error) {
        console.error('Error fetching selling customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch selling customer details'
        });
    }
};

// Get payments for a selling customer
const getSalePayments = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [payments] = await pool.query(
            'SELECT * FROM sales_payments WHERE customer_id = ? ORDER BY payment_date DESC',
            [id]
        );

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching sale payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sale payments'
        });
    }
};

// Create a new rice sale
const createRiceSale = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            customerId, 
            customerName, 
            customerPhone, 
            customerAddress,
            riceVarietyId, 
            quantityKg, 
            unitPrice, 
            paidAmount,
            paymentMethod = 'cash',
            referenceNumber,
            notes
        } = req.body;
        
        const createdBy = req.user.id;
        const saleDate = new Date();
        const totalPrice = quantityKg * unitPrice;
        const pendingAmount = totalPrice - paidAmount;

        // 1. Validate rice variety exists and has sufficient stock
        const [riceVarieties] = await connection.query(
            'SELECT current_stock_kg FROM rice_varieties WHERE id = ?',
            [riceVarietyId]
        );

        if (riceVarieties.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rice variety not found'
            });
        }

        const currentStock = parseFloat(riceVarieties[0].current_stock_kg);
        if (currentStock < quantityKg) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${currentStock}kg`
            });
        }

        let finalCustomerId = customerId;

        // 2. Handle customer - check if exists by phone first
        if (!customerId && customerPhone) {
            const [existingCustomers] = await connection.query(
                'SELECT id FROM selling_customers WHERE phone = ?',
                [customerPhone]
            );

            if (existingCustomers.length > 0) {
                finalCustomerId = existingCustomers[0].id;
            } else if (customerName) {
                // Only create new customer if name is provided
                const [customerResult] = await connection.query(
                    `INSERT INTO selling_customers 
                    (name, phone, address, customer_type) 
                    VALUES (?, ?, ?, 'retail')`,
                    [customerName, customerPhone, customerAddress || null]
                );
                finalCustomerId = customerResult.insertId;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Customer name is required for new customers'
                });
            }
        } else if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer information is required'
            });
        }

        // 3. Create sale record
        const [saleResult] = await connection.query(
            `INSERT INTO rice_sales 
            (customer_id, rice_variety_id, quantity_kg, unit_price, total_price, 
             paid_amount, pending_amount, sale_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [finalCustomerId, riceVarietyId, quantityKg, unitPrice, totalPrice, 
             paidAmount, pendingAmount, saleDate, createdBy]
        );

        // 4. Update customer financials
        await connection.query(
            `UPDATE selling_customers 
             SET total_purchases = total_purchases + ?,
                 total_paid = total_paid + ?,
                 total_pending = total_pending + ?
             WHERE id = ?`,
            [totalPrice, paidAmount, pendingAmount, finalCustomerId]
        );

        // 5. Update rice inventory
        await connection.query(
            `UPDATE rice_varieties 
             SET current_stock_kg = current_stock_kg - ?
             WHERE id = ?`,
            [quantityKg, riceVarietyId]
        );

        // 6. Record inventory adjustment
        await connection.query(
            `INSERT INTO inventory_adjustments 
            (rice_variety_id, adjustment_amount, previous_stock, new_stock, notes, adjusted_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                riceVarietyId, 
                -quantityKg, 
                currentStock, 
                currentStock - quantityKg,
                `Sold ${quantityKg}kg to customer ${finalCustomerId}`,
                createdBy
            ]
        );

        // 7. Record payment if any amount was paid
        if (paidAmount > 0) {
            await connection.query(
                `INSERT INTO sales_payments 
                (sale_id, customer_id, amount, payment_method, reference_number, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [saleResult.insertId, finalCustomerId, paidAmount, paymentMethod, referenceNumber, notes, createdBy]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Rice sale recorded successfully',
            data: {
                saleId: saleResult.insertId,
                customerId: finalCustomerId,
                totalPrice,
                pendingAmount
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording rice sale:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record rice sale',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Get all rice sales
const getAllRiceSales = async (req, res) => {
    try {
        const [sales] = await pool.query(`
            SELECT 
                rs.id, rs.quantity_kg, rs.unit_price, rs.total_price,
                rs.paid_amount, rs.pending_amount, rs.sale_date,
                sc.id as customer_id, sc.name as customer_name, sc.phone, sc.customer_type,
                rv.id as rice_variety_id, rv.name as rice_variety_name,
                u.username as created_by
            FROM rice_sales rs
            JOIN selling_customers sc ON rs.customer_id = sc.id
            JOIN rice_varieties rv ON rs.rice_variety_id = rv.id
            LEFT JOIN admin_users u ON rs.created_by = u.id
            ORDER BY rs.sale_date DESC
        `);

        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        console.error('Error fetching rice sales:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rice sales'
        });
    }
};

// Get sales by customer
const getSalesByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const [sales] = await pool.query(`
            SELECT 
                rs.id, rs.quantity_kg, rs.unit_price, rs.total_price,
                rs.paid_amount, rs.pending_amount, rs.sale_date,
                rv.name as rice_variety_name
            FROM rice_sales rs
            JOIN rice_varieties rv ON rs.rice_variety_id = rv.id
            WHERE rs.customer_id = ?
            ORDER BY rs.sale_date DESC
        `, [customerId]);

        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        console.error('Error fetching customer sales:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer sales'
        });
    }
};

// Record payment for a sale
const recordSalePayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { saleId } = req.params;
        const { amount, paymentMethod = 'cash', referenceNumber, notes } = req.body;
        const createdBy = req.user.id;

        // 1. Get sale details to validate
        const [saleRows] = await connection.query(
            'SELECT * FROM rice_sales WHERE id = ?',
            [saleId]
        );

        if (saleRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const sale = saleRows[0];
        
        // Validate payment amount doesn't exceed pending amount
        if (amount > sale.pending_amount) {
            return res.status(400).json({
                success: false,
                message: `Payment amount exceeds pending amount (Max: ${sale.pending_amount})`
            });
        }

        // 2. Record payment in sales_payments table
        await connection.query(
            `INSERT INTO sales_payments 
            (sale_id, customer_id, amount, payment_method, reference_number, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [saleId, sale.customer_id, amount, paymentMethod, referenceNumber, notes, createdBy]
        );

        // 3. Update the rice_sales table
        await connection.query(
            `UPDATE rice_sales 
             SET paid_amount = paid_amount + ?,
                 pending_amount = pending_amount - ?
             WHERE id = ?`,
            [amount, amount, saleId]
        );

        // 4. Update customer financials
        await connection.query(
            `UPDATE selling_customers 
             SET total_paid = total_paid + ?,
                 total_pending = total_pending - ?
             WHERE id = ?`,
            [amount, amount, sale.customer_id]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully for the sale'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording sale payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record payment for the sale',
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
        const { amount, paymentMethod = 'cash', notes } = req.body;
        const createdBy = req.user.id;

        // 1. Get all pending sales for this customer, ordered by oldest first
        const [pendingSales] = await connection.query(
            `SELECT id, pending_amount 
             FROM rice_sales 
             WHERE customer_id = ? AND pending_amount > 0
             ORDER BY sale_date ASC`,
            [customerId]
        );

        if (pendingSales.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No pending sales found for this customer'
            });
        }

        let remainingAmount = amount;
        const appliedPayments = [];

        // 2. Apply payment to oldest sales first
        for (const sale of pendingSales) {
            if (remainingAmount <= 0) break;

            const paymentAmount = Math.min(remainingAmount, sale.pending_amount);
            
            // Record payment
            await connection.query(
                `INSERT INTO sales_payments 
                (sale_id, customer_id, amount, payment_method, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [sale.id, customerId, paymentAmount, paymentMethod, notes, createdBy]
            );

            // Update sale record
            await connection.query(
                `UPDATE rice_sales 
                 SET paid_amount = paid_amount + ?,
                     pending_amount = pending_amount - ?
                 WHERE id = ?`,
                [paymentAmount, paymentAmount, sale.id]
            );

            appliedPayments.push({
                saleId: sale.id,
                amount: paymentAmount
            });

            remainingAmount -= paymentAmount;
        }

        // 3. Update customer financials
        await connection.query(
            `UPDATE selling_customers 
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
                appliedPayments,
                remainingAmount: remainingAmount > 0 ? remainingAmount : 0
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error recording customer payment:', error);
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
    createSellingCustomer,
    getAllSellingCustomers,
    getSellingCustomerById,
    createRiceSale,
    getAllRiceSales,
    getSalesByCustomer,
    recordSalePayment,
    getSalePayments,
    recordCustomerPayment
};