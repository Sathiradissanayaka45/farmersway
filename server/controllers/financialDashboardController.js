const mysql = require('mysql2/promise');
const moment = require('moment');
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

const getFinancialDashboard = async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        const monthStart = moment().startOf('month').format('YYYY-MM-DD');
        const yearStart = moment().startOf('year').format('YYYY-MM-DD');
        
        // Get key financial metrics
        const [metrics] = await pool.query(`
            SELECT 
                -- Total Assets
                (SELECT SUM(current_balance) FROM chart_of_accounts ca 
                 JOIN account_types at ON ca.account_type_id = at.id 
                 WHERE at.category = 'asset' AND ca.is_active = TRUE) as total_assets,
                
                -- Total Liabilities
                (SELECT SUM(current_balance) FROM chart_of_accounts ca 
                 JOIN account_types at ON ca.account_type_id = at.id 
                 WHERE at.category = 'liability' AND ca.is_active = TRUE) as total_liabilities,
                
                -- Total Equity
                (SELECT SUM(current_balance) FROM chart_of_accounts ca 
                 JOIN account_types at ON ca.account_type_id = at.id 
                 WHERE at.category = 'equity' AND ca.is_active = TRUE) as total_equity,
                
                -- Monthly Revenue
                (SELECT SUM(CASE 
                    WHEN at.normal_balance = 'credit' THEN jel.credit_amount - jel.debit_amount
                    ELSE jel.debit_amount - jel.credit_amount
                END) FROM journal_entry_lines jel
                JOIN journal_entries je ON jel.journal_entry_id = je.id
                JOIN chart_of_accounts ca ON jel.account_id = ca.id
                JOIN account_types at ON ca.account_type_id = at.id
                WHERE at.category = 'revenue' AND je.entry_date BETWEEN ? AND ?) as monthly_revenue,
                
                -- Monthly Expenses
                (SELECT SUM(CASE 
                    WHEN at.normal_balance = 'debit' THEN jel.debit_amount - jel.credit_amount
                    ELSE jel.credit_amount - jel.debit_amount
                END) FROM journal_entry_lines jel
                JOIN journal_entries je ON jel.journal_entry_id = je.id
                JOIN chart_of_accounts ca ON jel.account_id = ca.id
                JOIN account_types at ON ca.account_type_id = at.id
                WHERE at.category = 'expense' AND je.entry_date BETWEEN ? AND ?) as monthly_expenses,
                
                -- Cash Balance
                (SELECT SUM(current_balance) FROM chart_of_accounts 
                 WHERE account_name LIKE '%Cash%' OR account_name LIKE '%Bank%') as cash_balance,
                
                -- Accounts Receivable
                (SELECT SUM(current_balance) FROM chart_of_accounts 
                 WHERE account_name LIKE '%Accounts Receivable%') as accounts_receivable,
                
                -- Accounts Payable
                (SELECT SUM(current_balance) FROM chart_of_accounts 
                 WHERE account_name LIKE '%Accounts Payable%') as accounts_payable
        `, [monthStart, today, monthStart, today]);
        
        // Get recent transactions
        const [recentTransactions] = await pool.query(`
            SELECT 
                je.entry_date,
                je.entry_number,
                je.description,
                je.reference_type,
                SUM(jel.debit_amount) as total_debit,
                SUM(jel.credit_amount) as total_credit
            FROM journal_entries je
            JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
            GROUP BY je.id
            ORDER BY je.entry_date DESC, je.id DESC
            LIMIT 10
        `);
        
        // Get monthly trend
        const [monthlyTrend] = await pool.query(`
            SELECT 
                DATE_FORMAT(je.entry_date, '%Y-%m') as month,
                SUM(CASE WHEN at.category = 'revenue' THEN 
                    CASE WHEN at.normal_balance = 'credit' THEN jel.credit_amount - jel.debit_amount
                    ELSE jel.debit_amount - jel.credit_amount END ELSE 0 END) as revenue,
                SUM(CASE WHEN at.category = 'expense' THEN 
                    CASE WHEN at.normal_balance = 'debit' THEN jel.debit_amount - jel.credit_amount
                    ELSE jel.credit_amount - jel.debit_amount END ELSE 0 END) as expenses
            FROM journal_entries je
            JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
            JOIN chart_of_accounts ca ON jel.account_id = ca.id
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE je.entry_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(je.entry_date, '%Y-%m')
            ORDER BY month ASC
        `);
        
        const metric = metrics[0];
        const monthlyProfit = (parseFloat(metric.monthly_revenue) || 0) - (parseFloat(metric.monthly_expenses) || 0);
        const netWorth = (parseFloat(metric.total_assets) || 0) - (parseFloat(metric.total_liabilities) || 0);
        
        res.json({
            success: true,
            data: {
                overview: {
                    total_assets: parseFloat(metric.total_assets) || 0,
                    total_liabilities: parseFloat(metric.total_liabilities) || 0,
                    total_equity: parseFloat(metric.total_equity) || 0,
                    net_worth: netWorth,
                    cash_balance: parseFloat(metric.cash_balance) || 0,
                    accounts_receivable: parseFloat(metric.accounts_receivable) || 0,
                    accounts_payable: parseFloat(metric.accounts_payable) || 0
                },
                monthly_performance: {
                    revenue: parseFloat(metric.monthly_revenue) || 0,
                    expenses: parseFloat(metric.monthly_expenses) || 0,
                    profit: monthlyProfit,
                    profit_margin: parseFloat(metric.monthly_revenue) > 0 ? 
                        (monthlyProfit / parseFloat(metric.monthly_revenue) * 100).toFixed(2) + '%' : '0%'
                },
                recent_transactions: recentTransactions,
                monthly_trend: monthlyTrend
            }
        });
    } catch (error) {
        console.error('Error fetching financial dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch financial dashboard data'
        });
    }
};

const getAccountSummary = async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = `
            SELECT 
                at.category,
                COUNT(ca.id) as account_count,
                SUM(ca.current_balance) as total_balance,
                GROUP_CONCAT(ca.account_name SEPARATOR ', ') as accounts
            FROM chart_of_accounts ca
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE ca.is_active = TRUE
        `;
        
        const params = [];
        
        if (category) {
            query += ' AND at.category = ?';
            params.push(category);
        }
        
        query += ' GROUP BY at.category ORDER BY at.category';
        
        const [summary] = await pool.query(query, params);
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching account summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account summary'
        });
    }
};

module.exports = {
    getFinancialDashboard,
    getAccountSummary
};