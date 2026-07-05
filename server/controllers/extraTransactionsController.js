const mysql = require('mysql2/promise');
require('dotenv').config();
const { 
    recordExtraIncomeAccounting, 
    recordExtraExpenseAccounting,
    reverseExtraIncomeAccounting,
    reverseExtraExpenseAccounting
} = require('../middleware/accountingIntegration');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Income Type Functions
const createIncomeType = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Income type name is required'
            });
        }

        // Insert income type
        const [result] = await connection.query(
            'INSERT INTO income_types (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        // Create corresponding account in chart of accounts
        const accountCode = `INC-${String(result.insertId).padStart(4, '0')}`;
        const accountName = `Income - ${name}`;

        // Get income account type ID (revenue category)
        const [accountType] = await connection.query(
            "SELECT id FROM account_types WHERE category = 'revenue' LIMIT 1"
        );

        if (accountType.length > 0) {
            const [accountResult] = await connection.query(
                `INSERT INTO chart_of_accounts 
                (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
                VALUES (?, ?, ?, ?, 0, 0, 1)`,
                [accountCode, accountName, accountType[0].id, description || `Income from ${name}`]
            );

            // Update income type with account_id
            await connection.query(
                'UPDATE income_types SET account_id = ? WHERE id = ?',
                [accountResult.insertId, result.insertId]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Income type created successfully',
            data: {
                id: result.insertId,
                name,
                description
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating income type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create income type',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

const getAllIncomeTypes = async (req, res) => {
    try {
        const [incomeTypes] = await pool.query(`
            SELECT it.*, ca.account_code, ca.account_name, ca.current_balance
            FROM income_types it
            LEFT JOIN chart_of_accounts ca ON it.account_id = ca.id
            ORDER BY it.name ASC
        `);

        res.json({
            success: true,
            data: incomeTypes
        });
    } catch (error) {
        console.error('Error fetching income types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch income types'
        });
    }
};

// Income Record Functions
// controllers/extraTransactionsController.js - Update recordExtraIncome

const recordExtraIncome = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            income_type_id, 
            amount, 
            quantity, 
            unit_price, 
            description, 
            income_date,
            payment_method,
            payment_reference 
        } = req.body;
        
        const recorded_by = req.user.id;
        
        if (!income_type_id || !income_date) {
            return res.status(400).json({
                success: false,
                message: 'Income type and date are required'
            });
        }

        // Get income type name for accounting
        const [incomeType] = await connection.query(
            'SELECT name FROM income_types WHERE id = ?',
            [income_type_id]
        );

        if (incomeType.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Income type not found'
            });
        }

        // Calculate amount if quantity and unit_price are provided
        let finalAmount = amount;
        if (quantity && unit_price) {
            finalAmount = quantity * unit_price;
        } else if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Either amount or both quantity and unit price are required'
            });
        }

        const [result] = await connection.query(
            `INSERT INTO extra_income 
            (income_type_id, amount, quantity, unit_price, description, income_date, 
             recorded_by, payment_method, payment_reference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                income_type_id, 
                finalAmount, 
                quantity || null, 
                unit_price || null, 
                description || null, 
                income_date, 
                recorded_by,
                payment_method || 'cash',
                payment_reference || null
            ]
        );

        await connection.commit();

        // Record accounting entry AFTER commit
        try {
            await recordExtraIncomeAccounting({
                incomeId: result.insertId,
                incomeTypeId: income_type_id,
                incomeTypeName: incomeType[0].name,
                amount: parseFloat(finalAmount),
                description: description || null,
                income_date,
                payment_method: payment_method || 'cash',
                payment_reference
            }, recorded_by);
        } catch (accountingError) {
            console.error('Accounting error (non-fatal):', accountingError);
        }

        res.status(201).json({
            success: true,
            message: 'Extra income recorded successfully',
            data: {
                id: result.insertId,
                income_type_id,
                amount: finalAmount,
                quantity,
                unit_price,
                income_date,
                payment_method: payment_method || 'cash',
                payment_reference
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording extra income:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record extra income',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

const getAllExtraIncome = async (req, res) => {
  try {
    const { start_date, end_date, income_type_id, payment_method } = req.query;
    
    let query = `
      SELECT 
        ei.*, 
        ei.quantity,
        ei.unit_price,
        ei.amount,
        ei.payment_method,
        ei.payment_reference,
        it.name as income_type_name, 
        u.username as recorded_by_name
      FROM extra_income ei
      JOIN income_types it ON ei.income_type_id = it.id
      JOIN admin_users u ON ei.recorded_by = u.id
      WHERE ei.is_deleted = FALSE
    `;
    
    const params = [];
    
    if (start_date && end_date) {
      query += ' AND ei.income_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    if (income_type_id) {
      query += ' AND ei.income_type_id = ?';
      params.push(income_type_id);
    }
    
    if (payment_method) {
      query += ' AND ei.payment_method = ?';
      params.push(payment_method);
    }
    
    query += ' ORDER BY ei.income_date DESC';
    
    const [incomeRecords] = await pool.query(query, params);

    res.json({
      success: true,
      data: incomeRecords
    });
  } catch (error) {
    console.error('Error fetching extra income records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch extra income records'
    });
  }
};

// UPDATED: Update income record
const updateIncomeRecord = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { 
            income_type_id, 
            amount, 
            quantity, 
            unit_price, 
            description, 
            income_date,
            payment_method,
            payment_reference 
        } = req.body;
        
        // Calculate amount if quantity and unit_price are provided
        let finalAmount = amount;
        if (quantity && unit_price) {
            finalAmount = quantity * unit_price;
        } else if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Either amount or both quantity and unit price are required'
            });
        }

        // Get old record for accounting reversal
        const [oldRecord] = await connection.query(
            'SELECT * FROM extra_income WHERE id = ? AND is_deleted = FALSE',
            [id]
        );

        if (oldRecord.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Income record not found or already deleted'
            });
        }

        const [result] = await connection.query(
            `UPDATE extra_income 
             SET income_type_id = ?, 
                 amount = ?, 
                 quantity = ?, 
                 unit_price = ?, 
                 description = ?, 
                 income_date = ?,
                 payment_method = ?,
                 payment_reference = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND is_deleted = FALSE`,
            [
                income_type_id, 
                finalAmount, 
                quantity || null, 
                unit_price || null, 
                description || null, 
                income_date,
                payment_method || 'cash',
                payment_reference || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Income record not found or already deleted'
            });
        }

        // TODO: Update accounting entry (you need to create a function for updating accounting)
        // For now, we'll reverse the old and create new
        try {
            // First reverse old entry
            // This requires a separate accounting update function
            console.log('Accounting update required for income record:', id);
        } catch (accountingError) {
            console.error('Accounting update error (non-fatal):', accountingError);
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Income record updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating income record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update income record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// controllers/extraTransactionsController.js - Update softDeleteIncome

const softDeleteIncome = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const deleted_by = req.user.id;
        
        // Get record before deletion for accounting reversal
        const [record] = await connection.query(
            `SELECT ei.*, it.name as income_type_name, it.account_id
             FROM extra_income ei
             JOIN income_types it ON ei.income_type_id = it.id
             WHERE ei.id = ? AND ei.is_deleted = FALSE`,
            [id]
        );

        if (record.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Income record not found or already deleted'
            });
        }

        const income = record[0];

        const [result] = await connection.query(
            `UPDATE extra_income 
             SET is_deleted = TRUE,
                 deleted_by = ?,
                 deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND is_deleted = FALSE`,
            [deleted_by, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Income record not found or already deleted'
            });
        }

        await connection.commit();

        // Create reversing journal entry for deleted income
        try {
            await reverseExtraIncomeAccounting({
                incomeId: income.id,
                incomeTypeId: income.income_type_id,
                incomeTypeName: income.income_type_name,
                amount: parseFloat(income.amount),
                description: income.description,
                income_date: income.income_date,
                payment_method: income.payment_method,
                payment_reference: income.payment_reference,
                deleted_by: deleted_by
            }, deleted_by);
        } catch (accountingError) {
            console.error('Accounting reversal error (non-fatal):', accountingError);
        }

        res.json({
            success: true,
            message: 'Income record deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting income record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete income record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Expense Type Functions (similar to income types)
const createExpenseType = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Expense type name is required'
            });
        }

        // Insert expense type
        const [result] = await connection.query(
            'INSERT INTO expense_types (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        // Create corresponding account in chart of accounts
        const accountCode = `EXP-${String(result.insertId).padStart(4, '0')}`;
        const accountName = `Expense - ${name}`;

        // Get expense account type ID
        const [accountType] = await connection.query(
            "SELECT id FROM account_types WHERE category = 'expense' LIMIT 1"
        );

        if (accountType.length > 0) {
            const [accountResult] = await connection.query(
                `INSERT INTO chart_of_accounts 
                (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
                VALUES (?, ?, ?, ?, 0, 0, 1)`,
                [accountCode, accountName, accountType[0].id, description || `Expenses for ${name}`]
            );

            // Update expense type with account_id
            await connection.query(
                'UPDATE expense_types SET account_id = ? WHERE id = ?',
                [accountResult.insertId, result.insertId]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Expense type created successfully',
            data: {
                id: result.insertId,
                name,
                description
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating expense type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create expense type',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

const getAllExpenseTypes = async (req, res) => {
    try {
        const [expenseTypes] = await pool.query(`
            SELECT et.*, ca.account_code, ca.account_name, ca.current_balance
            FROM expense_types et
            LEFT JOIN chart_of_accounts ca ON et.account_id = ca.id
            ORDER BY et.name ASC
        `);

        res.json({
            success: true,
            data: expenseTypes
        });
    } catch (error) {
        console.error('Error fetching expense types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense types'
        });
    }
};

// Expense Record Functions (similar to income records)
// controllers/extraTransactionsController.js - Update recordExtraExpense

const recordExtraExpense = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            expense_type_id, 
            amount, 
            description, 
            expense_date,
            payment_method,
            payment_reference 
        } = req.body;
        
        const recorded_by = req.user.id;
        
        if (!expense_type_id || !amount || !expense_date) {
            return res.status(400).json({
                success: false,
                message: 'Expense type, amount and date are required'
            });
        }

        // Get expense type name for accounting
        const [expenseType] = await connection.query(
            'SELECT name FROM expense_types WHERE id = ?',
            [expense_type_id]
        );

        if (expenseType.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense type not found'
            });
        }

        const [result] = await connection.query(
            `INSERT INTO extra_expenses 
            (expense_type_id, amount, description, expense_date, recorded_by,
             payment_method, payment_reference)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                expense_type_id, 
                amount, 
                description || null, 
                expense_date, 
                recorded_by,
                payment_method || 'cash',
                payment_reference || null
            ]
        );

        await connection.commit();

        // Record accounting entry AFTER commit
        try {
            await recordExtraExpenseAccounting({
                expenseId: result.insertId,
                expenseTypeId: expense_type_id,
                expenseTypeName: expenseType[0].name,
                amount: parseFloat(amount),
                description: description || null,
                expense_date,
                payment_method: payment_method || 'cash',
                payment_reference
            }, recorded_by);
        } catch (accountingError) {
            console.error('Accounting error (non-fatal):', accountingError);
        }

        res.status(201).json({
            success: true,
            message: 'Extra expense recorded successfully',
            data: {
                id: result.insertId,
                expense_type_id,
                amount,
                expense_date,
                payment_method: payment_method || 'cash',
                payment_reference
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording extra expense:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record extra expense',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};


const getAllExtraExpenses = async (req, res) => {
  try {
    const { start_date, end_date, expense_type_id, payment_method } = req.query;
    
    let query = `
      SELECT ee.*, 
             ee.payment_method,
             ee.payment_reference,
             et.name as expense_type_name, 
             u.username as recorded_by_name
      FROM extra_expenses ee
      JOIN expense_types et ON ee.expense_type_id = et.id
      JOIN admin_users u ON ee.recorded_by = u.id
      WHERE ee.is_deleted = FALSE
    `;
    
    const params = [];
    
    if (start_date && end_date) {
      query += ' AND ee.expense_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    if (expense_type_id) {
      query += ' AND ee.expense_type_id = ?';
      params.push(expense_type_id);
    }
    
    if (payment_method) {
      query += ' AND ee.payment_method = ?';
      params.push(payment_method);
    }
    
    query += ' ORDER BY ee.expense_date DESC';
    
    const [expenseRecords] = await pool.query(query, params);

    res.json({
      success: true,
      data: expenseRecords
    });
  } catch (error) {
    console.error('Error fetching extra expense records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch extra expense records'
    });
  }
};

const updateExpenseRecord = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { 
            expense_type_id, 
            amount, 
            description, 
            expense_date,
            payment_method,
            payment_reference 
        } = req.body;
        
        // Get old record for accounting reversal
        const [oldRecord] = await connection.query(
            'SELECT * FROM extra_expenses WHERE id = ? AND is_deleted = FALSE',
            [id]
        );

        if (oldRecord.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense record not found or already deleted'
            });
        }

        const [result] = await connection.query(
            `UPDATE extra_expenses 
             SET expense_type_id = ?, 
                 amount = ?, 
                 description = ?, 
                 expense_date = ?,
                 payment_method = ?,
                 payment_reference = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND is_deleted = FALSE`,
            [
                expense_type_id, 
                amount, 
                description || null, 
                expense_date,
                payment_method || 'cash',
                payment_reference || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense record not found or already deleted'
            });
        }

        // TODO: Update accounting entry
        try {
            console.log('Accounting update required for expense record:', id);
        } catch (accountingError) {
            console.error('Accounting update error (non-fatal):', accountingError);
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Expense record updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating expense record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expense record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// controllers/extraTransactionsController.js - Update softDeleteExpense

const softDeleteExpense = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const deleted_by = req.user.id;
        
        // Get record before deletion for accounting reversal
        const [record] = await connection.query(
            `SELECT ee.*, et.name as expense_type_name, et.account_id
             FROM extra_expenses ee
             JOIN expense_types et ON ee.expense_type_id = et.id
             WHERE ee.id = ? AND ee.is_deleted = FALSE`,
            [id]
        );

        if (record.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense record not found or already deleted'
            });
        }

        const expense = record[0];

        const [result] = await connection.query(
            `UPDATE extra_expenses 
             SET is_deleted = TRUE,
                 deleted_by = ?,
                 deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND is_deleted = FALSE`,
            [deleted_by, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense record not found or already deleted'
            });
        }

        await connection.commit();

        // Create reversing journal entry for deleted expense
        try {
            await reverseExtraExpenseAccounting({
                expenseId: expense.id,
                expenseTypeId: expense.expense_type_id,
                expenseTypeName: expense.expense_type_name,
                amount: parseFloat(expense.amount),
                description: expense.description,
                expense_date: expense.expense_date,
                payment_method: expense.payment_method,
                payment_reference: expense.payment_reference,
                deleted_by: deleted_by
            }, deleted_by);
        } catch (accountingError) {
            console.error('Accounting reversal error (non-fatal):', accountingError);
        }

        res.json({
            success: true,
            message: 'Expense record deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting expense record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete expense record',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Summary Report
const getIncomeExpenseSummary = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        // Get total income
        const [incomeResult] = await pool.query(
            `SELECT SUM(amount) as total_income
             FROM extra_income
             WHERE income_date BETWEEN ? AND ? AND is_deleted = FALSE`,
            [start_date, end_date]
        );
        
        // Get total expenses
        const [expenseResult] = await pool.query(
            `SELECT SUM(amount) as total_expenses
             FROM extra_expenses
             WHERE expense_date BETWEEN ? AND ? AND is_deleted = FALSE`,
            [start_date, end_date]
        );
        
        // Get income by type
        const [incomeByType] = await pool.query(
            `SELECT it.name as type_name, SUM(ei.amount) as total_amount
             FROM extra_income ei
             JOIN income_types it ON ei.income_type_id = it.id
             WHERE ei.income_date BETWEEN ? AND ? AND ei.is_deleted = FALSE
             GROUP BY it.name
             ORDER BY total_amount DESC`,
            [start_date, end_date]
        );
        
        // Get expenses by type
        const [expensesByType] = await pool.query(
            `SELECT et.name as type_name, SUM(ee.amount) as total_amount
             FROM extra_expenses ee
             JOIN expense_types et ON ee.expense_type_id = et.id
             WHERE ee.expense_date BETWEEN ? AND ? AND ee.is_deleted = FALSE
             GROUP BY et.name
             ORDER BY total_amount DESC`,
            [start_date, end_date]
        );
        
        res.json({
            success: true,
            data: {
                total_income: incomeResult[0].total_income || 0,
                total_expenses: expenseResult[0].total_expenses || 0,
                net_balance: (incomeResult[0].total_income || 0) - (expenseResult[0].total_expenses || 0),
                income_by_type: incomeByType,
                expenses_by_type: expensesByType
            }
        });
    } catch (error) {
        console.error('Error generating income/expense summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate summary',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getFinancialReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        // Convert all numeric values to proper numbers
        const toNumber = (value) => parseFloat(value) || 0;

        // 1. Get all sales data
        const [salesData] = await pool.query(`
            SELECT 
                SUM(total_price) as total_sales,
                SUM(paid_amount) as total_sales_paid,
                SUM(pending_amount) as total_sales_pending,
                COUNT(*) as total_sales_count
            FROM rice_sales
            WHERE sale_date BETWEEN ? AND ?
        `, [start_date, end_date]);

        // 2. Get all purchase data
        const [purchaseData] = await pool.query(`
            SELECT 
                SUM(total_price) as total_purchases,
                SUM(paid_amount) as total_purchases_paid,
                SUM(pending_amount) as total_purchases_pending,
                COUNT(*) as total_purchases_count
            FROM rice_purchases
            WHERE purchase_date BETWEEN ? AND ?
        `, [start_date, end_date]);

        // 3. Get milling data (cost and output)
        const [millingData] = await pool.query(`
            SELECT 
                SUM(mr.quantity_kg) as total_input_kg,
                SUM(mc.returned_quantity_kg) as total_output_kg,
                (SUM(mr.quantity_kg) - SUM(mc.returned_quantity_kg)) as milling_loss_kg
            FROM milling_records mr
            JOIN milling_completions mc ON mr.id = mc.milling_record_id
            WHERE mr.milling_date BETWEEN ? AND ?
            AND mr.status = 'completed'
        `, [start_date, end_date]);

        // 4. Get boiling data (cost and output)
        const [boilingData] = await pool.query(`
            SELECT 
                SUM(br.quantity_kg) as total_input_kg,
                SUM(bc.returned_quantity_kg) as total_output_kg,
                SUM(bc.missing_quantity_kg) as boiling_loss_kg,
                SUM(bc.cost_amount) as total_boiling_cost
            FROM boiling_records br
            JOIN boiling_completions bc ON br.id = bc.boiling_record_id
            WHERE br.boiling_date BETWEEN ? AND ?
            AND br.status = 'completed'
        `, [start_date, end_date]);

        // 5. Get extra income data
        const [extraIncome] = await pool.query(`
            SELECT 
                SUM(amount) as total_extra_income,
                COUNT(*) as total_extra_income_count
            FROM extra_income
            WHERE income_date BETWEEN ? AND ?
            AND is_deleted = FALSE
        `, [start_date, end_date]);

        // 6. Get extra expenses data
        const [extraExpenses] = await pool.query(`
            SELECT 
                SUM(amount) as total_extra_expenses,
                COUNT(*) as total_extra_expenses_count
            FROM extra_expenses
            WHERE expense_date BETWEEN ? AND ?
            AND is_deleted = FALSE
        `, [start_date, end_date]);

        // Convert all values to numbers
        const sales = {
            total_sales: toNumber(salesData[0]?.total_sales),
            total_paid: toNumber(salesData[0]?.total_sales_paid),
            total_pending: toNumber(salesData[0]?.total_sales_pending),
            total_transactions: toNumber(salesData[0]?.total_sales_count)
        };

        const purchases = {
            total_purchases: toNumber(purchaseData[0]?.total_purchases),
            total_paid: toNumber(purchaseData[0]?.total_purchases_paid),
            total_pending: toNumber(purchaseData[0]?.total_purchases_pending),
            total_transactions: toNumber(purchaseData[0]?.total_purchases_count)
        };

        const milling = {
            total_input_kg: toNumber(millingData[0]?.total_input_kg),
            total_output_kg: toNumber(millingData[0]?.total_output_kg),
            milling_loss_kg: toNumber(millingData[0]?.milling_loss_kg)
        };

        const boiling = {
            total_input_kg: toNumber(boilingData[0]?.total_input_kg),
            total_output_kg: toNumber(boilingData[0]?.total_output_kg),
            boiling_loss_kg: toNumber(boilingData[0]?.boiling_loss_kg),
            total_cost: toNumber(boilingData[0]?.total_boiling_cost)
        };

        const extra = {
            total_income: toNumber(extraIncome[0]?.total_extra_income),
            total_expenses: toNumber(extraExpenses[0]?.total_extra_expenses)
        };

        // Calculate totals
        const totalRevenue = sales.total_sales + extra.total_income;
        const totalCost = purchases.total_purchases + boiling.total_cost + extra.total_expenses;
        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(2) + '%' : '0%';

        // Calculate yields
        const millingYield = milling.total_input_kg > 0 
            ? (milling.total_output_kg / milling.total_input_kg * 100).toFixed(2) + '%' 
            : '0%';
            
        const boilingYield = boiling.total_input_kg > 0 
            ? (boiling.total_output_kg / boiling.total_input_kg * 100).toFixed(2) + '%' 
            : '0%';

        // 7. Get detailed sales by rice variety
        const [salesByVariety] = await pool.query(`
            SELECT 
                rv.name as rice_variety,
                SUM(rs.quantity_kg) as total_kg_sold,
                SUM(rs.total_price) as total_sales_amount,
                AVG(rs.unit_price) as avg_price_per_kg
            FROM rice_sales rs
            JOIN rice_varieties rv ON rs.rice_variety_id = rv.id
            WHERE rs.sale_date BETWEEN ? AND ?
            GROUP BY rv.name
            ORDER BY total_sales_amount DESC
        `, [start_date, end_date]);

        // 8. Get detailed purchases by rice variety
        const [purchasesByVariety] = await pool.query(`
            SELECT 
                rv.name as rice_variety,
                SUM(rp.quantity_kg) as total_kg_purchased,
                SUM(rp.total_price) as total_purchase_amount,
                AVG(rp.unit_price) as avg_price_per_kg
            FROM rice_purchases rp
            JOIN rice_varieties rv ON rp.rice_type_id = rv.id
            WHERE rp.purchase_date BETWEEN ? AND ?
            GROUP BY rv.name
            ORDER BY total_purchase_amount DESC
        `, [start_date, end_date]);

        // 9. Get inventory changes
        const [inventoryChanges] = await pool.query(`
            SELECT 
                rv.name as rice_variety,
                SUM(CASE WHEN ia.adjustment_amount > 0 THEN ia.adjustment_amount ELSE 0 END) as total_increase_kg,
                SUM(CASE WHEN ia.adjustment_amount < 0 THEN ABS(ia.adjustment_amount) ELSE 0 END) as total_decrease_kg,
                rv.current_stock_kg as current_stock
            FROM inventory_adjustments ia
            JOIN rice_varieties rv ON ia.rice_variety_id = rv.id
            WHERE ia.adjustment_date BETWEEN ? AND ?
            GROUP BY rv.name, rv.current_stock_kg
        `, [start_date, end_date]);

        // Prepare the final report
        const report = {
            date_range: {
                start_date,
                end_date
            },
            summary: {
                total_revenue: totalRevenue,
                total_cost: totalCost,
                gross_profit: grossProfit,
                profit_margin: profitMargin
            },
            sales: {
                ...sales,
                by_variety: salesByVariety.map(item => ({
                    ...item,
                    total_kg_sold: toNumber(item.total_kg_sold),
                    total_sales_amount: toNumber(item.total_sales_amount),
                    avg_price_per_kg: toNumber(item.avg_price_per_kg)
                }))
            },
            purchases: {
                ...purchases,
                by_variety: purchasesByVariety.map(item => ({
                    ...item,
                    total_kg_purchased: toNumber(item.total_kg_purchased),
                    total_purchase_amount: toNumber(item.total_purchase_amount),
                    avg_price_per_kg: toNumber(item.avg_price_per_kg)
                }))
            },
            milling: {
                ...milling,
                milling_yield: millingYield
            },
            boiling: {
                ...boiling,
                boiling_yield: boilingYield
            },
            extra_transactions: {
                ...extra,
                total_income_count: toNumber(extraIncome[0]?.total_extra_income_count),
                total_expenses_count: toNumber(extraExpenses[0]?.total_extra_expenses_count),
                net_extra: extra.total_income - extra.total_expenses
            },
            inventory_changes: inventoryChanges.map(item => ({
                ...item,
                total_increase_kg: toNumber(item.total_increase_kg),
                total_decrease_kg: toNumber(item.total_decrease_kg),
                current_stock: toNumber(item.current_stock)
            }))
        };

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating financial report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate financial report',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
const getDashboardData = async (req, res) => {
    try {
        const { period = 'month' } = req.query; // day, week, month, year
        
        // Calculate date ranges based on period
        const now = new Date();
        let startDate, endDate = now.toISOString().split('T')[0];
        
        switch(period) {
            case 'day':
                startDate = endDate;
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        }
        
        // Get sales data for the period
        const [salesData] = await pool.query(`
            SELECT 
                DATE(sale_date) as date,
                SUM(total_price) as total_sales,
                SUM(paid_amount) as paid_amount,
                COUNT(*) as transaction_count
            FROM rice_sales
            WHERE sale_date BETWEEN ? AND ?
            GROUP BY DATE(sale_date)
            ORDER BY date
        `, [startDate, endDate]);
        
        // Get purchase data for the period
        const [purchaseData] = await pool.query(`
            SELECT 
                DATE(purchase_date) as date,
                SUM(total_price) as total_purchases,
                SUM(paid_amount) as paid_amount,
                COUNT(*) as transaction_count
            FROM rice_purchases
            WHERE purchase_date BETWEEN ? AND ?
            GROUP BY DATE(purchase_date)
            ORDER BY date
        `, [startDate, endDate]);
        
        // Get inventory summary
        const [inventorySummary] = await pool.query(`
            SELECT 
                rice_type,
                COUNT(*) as variety_count,
                SUM(current_stock_kg) as total_stock,
                SUM(CASE WHEN current_stock_kg <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count
            FROM rice_varieties
            GROUP BY rice_type
        `);
        
        // Get recent transactions
        const [recentSales] = await pool.query(`
            SELECT rs.*, rv.name as rice_name, c.name as customer_name
            FROM rice_sales rs
            JOIN rice_varieties rv ON rs.rice_variety_id = rv.id
            JOIN customers c ON rs.customer_id = c.id
            ORDER BY rs.sale_date DESC
            LIMIT 5
        `);
        
        const [recentPurchases] = await pool.query(`
            SELECT rp.*, rv.name as rice_name, c.name as customer_name
            FROM rice_purchases rp
            JOIN rice_varieties rv ON rp.rice_type_id = rv.id
            JOIN customers c ON rp.customer_id = c.id
            ORDER BY rp.purchase_date DESC
            LIMIT 5
        `);
        
        // Get financial summary
        const [financialSummary] = await pool.query(`
            SELECT 
                (SELECT COALESCE(SUM(total_price), 0) FROM rice_sales WHERE sale_date BETWEEN ? AND ?) as total_sales,
                (SELECT COALESCE(SUM(total_price), 0) FROM rice_purchases WHERE purchase_date BETWEEN ? AND ?) as total_purchases,
                (SELECT COALESCE(SUM(amount), 0) FROM extra_income WHERE income_date BETWEEN ? AND ? AND is_deleted = FALSE) as extra_income,
                (SELECT COALESCE(SUM(amount), 0) FROM extra_expenses WHERE expense_date BETWEEN ? AND ? AND is_deleted = FALSE) as extra_expenses
        `, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]);
        
        // Calculate profit
        const totalRevenue = parseFloat(financialSummary[0].total_sales) + parseFloat(financialSummary[0].extra_income);
        const totalCost = parseFloat(financialSummary[0].total_purchases) + parseFloat(financialSummary[0].extra_expenses);
        const netProfit = totalRevenue - totalCost;
        
        res.json({
            success: true,
            data: {
                period: {
                    start: startDate,
                    end: endDate,
                    type: period
                },
                financial: {
                    total_sales: financialSummary[0].total_sales,
                    total_purchases: financialSummary[0].total_purchases,
                    extra_income: financialSummary[0].extra_income,
                    extra_expenses: financialSummary[0].extra_expenses,
                    net_profit: netProfit
                },
                sales_trend: salesData,
                purchase_trend: purchaseData,
                inventory: inventorySummary,
                recent_transactions: {
                    sales: recentSales,
                    purchases: recentPurchases
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    // Income functions
    createIncomeType,
    getAllIncomeTypes,
    recordExtraIncome,
    getAllExtraIncome,
    softDeleteIncome,
    updateIncomeRecord,
    
    
    // Expense functions
    createExpenseType,
    getAllExpenseTypes,
    recordExtraExpense,
    getAllExtraExpenses,
    softDeleteExpense,
    updateExpenseRecord,
    
    // Reports
    getIncomeExpenseSummary,
    getFinancialReport,
    getDashboardData 
};