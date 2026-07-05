// scripts/linkExistingCustomers.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function linkExistingCustomers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    const connection = await pool.getConnection();
    try {
        // Get all customers without account_id
        const [customers] = await connection.query(
            'SELECT id, name FROM customers WHERE account_id IS NULL'
        );

        for (const customer of customers) {
            // Create account for customer
            const accountCode = `AR-CUST-${String(customer.id).padStart(5, '0')}`;
            const accountName = `Accounts Receivable - ${customer.name}`;

            const [result] = await connection.query(
                `INSERT INTO chart_of_accounts 
                (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
                SELECT ?, ?, at.id, ?, 0, 0, 1
                FROM account_types at
                WHERE at.category = 'asset' AND at.name LIKE '%Receivable%'
                LIMIT 1`,
                [accountCode, accountName, `Receivable from customer ${customer.name}`]
            );

            // Update customer with account_id
            await connection.query(
                'UPDATE customers SET account_id = ? WHERE id = ?',
                [result.insertId, customer.id]
            );

            console.log(`Created account for customer: ${customer.name}`);
        }

        console.log('All customers linked successfully');
    } catch (error) {
        console.error('Error linking customers:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

linkExistingCustomers();