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


const generateEntryNumber = async (date) => {
    // Ensure we only use the date part (YYYY-MM-DD)
    let dateStr;
    if (date instanceof Date) {
        dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    } else if (typeof date === 'string') {
        // If it's a string, extract just the date part
        dateStr = date.split('T')[0]; // Format: YYYY-MM-DD
    } else {
        dateStr = new Date().toISOString().split('T')[0];
    }
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(5, 7);
    
    console.log('Generating entry number for date:', dateStr, 'year:', year, 'month:', month);
    
    // Get the maximum sequence number for this date to avoid duplicates
    const [rows] = await pool.query(
        `SELECT MAX(CAST(SUBSTRING(entry_number, -4) AS UNSIGNED)) as max_sequence 
         FROM journal_entries 
         WHERE entry_number LIKE ?`,
        [`JE-${year}${month}-%`]
    );
    
    const maxSequence = rows[0].max_sequence || 0;
    const sequence = (maxSequence + 1).toString().padStart(4, '0');
    const entryNumber = `JE-${year}${month}-${sequence}`;
    
    console.log('Generated entry number:', entryNumber);
    return entryNumber;
};

// Create journal entry
// controllers/accountingController.js - Update createJournalEntry

const createJournalEntry = async (entryData) => {
    console.log('createJournalEntry called with:', JSON.stringify(entryData, null, 2));
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { entry_date, description, reference_type, reference_id, lines, created_by } = entryData;
        
        // Validate required fields
        if (!entry_date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
            throw new Error('Invalid journal entry data: missing required fields');
        }
        
        // Format the date properly - ensure it's just YYYY-MM-DD
        let formattedDate;
        if (entry_date instanceof Date) {
            formattedDate = entry_date.toISOString().split('T')[0];
        } else if (typeof entry_date === 'string') {
            // If it's already in YYYY-MM-DD format, use it as is
            if (entry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                formattedDate = entry_date;
            } else {
                formattedDate = entry_date.split('T')[0];
            }
        } else {
            formattedDate = new Date().toISOString().split('T')[0];
        }
        
        console.log('Formatted date for entry:', formattedDate);
        
        // Generate entry number
        const entry_number = await generateEntryNumber(formattedDate);
        console.log('Generated entry number:', entry_number);
        
        // Calculate totals
        let total_debit = 0;
        let total_credit = 0;
        
        lines.forEach(line => {
            total_debit += parseFloat(line.debit_amount) || 0;
            total_credit += parseFloat(line.credit_amount) || 0;
        });
        
        console.log(`Totals - Debit: ${total_debit}, Credit: ${total_credit}`);
        
        // Validate debit = credit
        if (Math.abs(total_debit - total_credit) > 0.01) {
            throw new Error(`Debit (${total_debit}) must equal Credit (${total_credit})`);
        }
        
        // Create journal entry
        const [entryResult] = await connection.query(
            `INSERT INTO journal_entries 
            (entry_number, entry_date, description, reference_type, reference_id, 
             total_debit, total_credit, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [entry_number, formattedDate, description, reference_type, reference_id, 
             total_debit, total_credit, created_by]
        );
        
        const journal_entry_id = entryResult.insertId;
        console.log('Journal entry inserted with ID:', journal_entry_id);
        
        // Create journal entry lines
        for (const line of lines) {
            await connection.query(
                `INSERT INTO journal_entry_lines 
                (journal_entry_id, account_id, debit_amount, credit_amount, description)
                VALUES (?, ?, ?, ?, ?)`,
                [journal_entry_id, line.account_id, line.debit_amount, line.credit_amount, line.description]
            );
            
            // Update account balance
            const accountChange = (parseFloat(line.debit_amount) || 0) - (parseFloat(line.credit_amount) || 0);
            
            // Get account type to determine normal balance
            const [accountInfo] = await connection.query(`
                SELECT c.current_balance, t.normal_balance 
                FROM chart_of_accounts c
                JOIN account_types t ON c.account_type_id = t.id
                WHERE c.id = ?
            `, [line.account_id]);
            
            if (accountInfo.length > 0) {
                const currentBalance = parseFloat(accountInfo[0].current_balance) || 0;
                const normalBalance = accountInfo[0].normal_balance;
                
                let newBalance;
                if (normalBalance === 'debit') {
                    newBalance = currentBalance + accountChange;
                } else {
                    newBalance = currentBalance - accountChange;
                }
                
                // Update account balance
                await connection.query(
                    'UPDATE chart_of_accounts SET current_balance = ? WHERE id = ?',
                    [newBalance, line.account_id]
                );
                
                // Update account balance history
                await connection.query(
                    `INSERT INTO account_balances (account_id, date, balance, balance_type)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     balance = VALUES(balance),
                     balance_type = VALUES(balance_type)`,
                    [line.account_id, formattedDate, Math.abs(newBalance), newBalance >= 0 ? 'debit' : 'credit']
                );
            }
        }
        
        await connection.commit();
        
        return {
            id: journal_entry_id,
            entry_number,
            entry_date: formattedDate,
            total_debit,
            total_credit
        };
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating journal entry:', error);
        throw error;
    } finally {
        connection.release();
    }
};

// Get all journal entries
const getAllJournalEntries = async (req, res) => {
    try {
        const { start_date, end_date, account_id, reference_type } = req.query;
        
        let query = `
            SELECT 
                je.*,
                u.username as created_by_name,
                COUNT(jel.id) as line_count
            FROM journal_entries je
            JOIN admin_users u ON je.created_by = u.id
            LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (start_date && end_date) {
            query += ' AND je.entry_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }
        
        if (account_id) {
            query += ' AND je.id IN (SELECT journal_entry_id FROM journal_entry_lines WHERE account_id = ?)';
            params.push(account_id);
        }
        
        if (reference_type) {
            query += ' AND je.reference_type = ?';
            params.push(reference_type);
        }
        
        query += ' GROUP BY je.id ORDER BY je.entry_date DESC, je.id DESC';
        
        const [entries] = await pool.query(query, params);
        
        res.json({
            success: true,
            data: entries
        });
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch journal entries'
        });
    }
};

// Get journal entry details
const getJournalEntryDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get entry header
        const [entries] = await pool.query(`
            SELECT 
                je.*,
                u.username as created_by_name
            FROM journal_entries je
            JOIN admin_users u ON je.created_by = u.id
            WHERE je.id = ?
        `, [id]);
        
        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found'
            });
        }
        
        // Get entry lines with account details
        const [lines] = await pool.query(`
            SELECT 
                jel.*,
                ca.account_code,
                ca.account_name,
                at.name as account_type,
                at.normal_balance
            FROM journal_entry_lines jel
            JOIN chart_of_accounts ca ON jel.account_id = ca.id
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE jel.journal_entry_id = ?
            ORDER BY jel.debit_amount DESC, jel.credit_amount DESC
        `, [id]);
        
        res.json({
            success: true,
            data: {
                entry: entries[0],
                lines: lines
            }
        });
    } catch (error) {
        console.error('Error fetching journal entry details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch journal entry details'
        });
    }
};

// Get chart of accounts
const getChartOfAccounts = async (req, res) => {
    try {
        const { category, active_only } = req.query;
        
        let query = `
            SELECT 
                ca.*,
                at.name as account_type_name,
                at.normal_balance,
                at.category,
                pca.account_name as parent_account_name
            FROM chart_of_accounts ca
            JOIN account_types at ON ca.account_type_id = at.id
            LEFT JOIN chart_of_accounts pca ON ca.parent_account_id = pca.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (active_only === 'true') {
            query += ' AND ca.is_active = TRUE';
        }
        
        if (category) {
            query += ' AND at.category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY ca.account_code ASC';
        
        const [accounts] = await pool.query(query, params);
        
        res.json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error('Error fetching chart of accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chart of accounts'
        });
    }
};

// Create new account
const createAccount = async (req, res) => {
    try {
        const { 
            account_code, 
            account_name, 
            account_type_id, 
            parent_account_id, 
            description,
            opening_balance 
        } = req.body;
        
        const userId = req.user.id;
        
        // Validate required fields
        if (!account_code || !account_name || !account_type_id) {
            return res.status(400).json({
                success: false,
                message: 'Account code, name and type are required'
            });
        }
        
        // Check if account code already exists
        const [existing] = await pool.query(
            'SELECT id FROM chart_of_accounts WHERE account_code = ?',
            [account_code]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Account code already exists'
            });
        }
        
        const [result] = await pool.query(
            `INSERT INTO chart_of_accounts 
            (account_code, account_name, account_type_id, parent_account_id, 
             description, opening_balance, current_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                account_code, 
                account_name, 
                account_type_id, 
                parent_account_id || null, 
                description || null,
                opening_balance || 0,
                opening_balance || 0
            ]
        );
        
        // Record opening balance transaction if exists
        if (opening_balance && parseFloat(opening_balance) !== 0) {
            const accountType = await getAccountType(account_type_id);
            const today = moment().format('YYYY-MM-DD');
            
            const entryData = {
                entry_date: today,
                description: `Opening balance for ${account_name}`,
                reference_type: 'manual_journal',
                reference_id: null,
                created_by: userId,
                lines: []
            };
            
            if (accountType.category === 'asset' || accountType.category === 'expense') {
                // Debit asset/expense account
                entryData.lines.push({
                    account_id: result.insertId,
                    debit_amount: Math.abs(opening_balance),
                    credit_amount: 0,
                    description: 'Opening balance'
                });
                
                // Credit retained earnings
                const [retainedEarnings] = await pool.query(
                    "SELECT id FROM chart_of_accounts WHERE account_name LIKE '%Retained Earnings%' LIMIT 1"
                );
                
                if (retainedEarnings.length > 0) {
                    entryData.lines.push({
                        account_id: retainedEarnings[0].id,
                        debit_amount: 0,
                        credit_amount: Math.abs(opening_balance),
                        description: 'Opening balance contra'
                    });
                }
            } else if (accountType.category === 'liability' || accountType.category === 'equity' || accountType.category === 'revenue') {
                // Credit liability/equity/revenue account
                entryData.lines.push({
                    account_id: result.insertId,
                    debit_amount: 0,
                    credit_amount: Math.abs(opening_balance),
                    description: 'Opening balance'
                });
                
                // Debit retained earnings
                const [retainedEarnings] = await pool.query(
                    "SELECT id FROM chart_of_accounts WHERE account_name LIKE '%Retained Earnings%' LIMIT 1"
                );
                
                if (retainedEarnings.length > 0) {
                    entryData.lines.push({
                        account_id: retainedEarnings[0].id,
                        debit_amount: Math.abs(opening_balance),
                        credit_amount: 0,
                        description: 'Opening balance contra'
                    });
                }
            }
            
            await createJournalEntry(entryData);
        }
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                id: result.insertId,
                account_code,
                account_name
            }
        });
        
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Helper function to get account type
const getAccountType = async (account_type_id) => {
    const [result] = await pool.query(
        'SELECT * FROM account_types WHERE id = ?',
        [account_type_id]
    );
    return result[0];
};

// Get general ledger
const getGeneralLedger = async (req, res) => {
    try {
        const { start_date, end_date, account_id } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        let query = `
            SELECT 
                je.entry_date,
                je.entry_number,
                je.description as journal_description,
                jel.description as line_description,
                ca.account_code,
                ca.account_name,
                jel.debit_amount,
                jel.credit_amount,
                at.normal_balance,
                je.reference_type,
                je.reference_id
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            JOIN chart_of_accounts ca ON jel.account_id = ca.id
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE je.entry_date BETWEEN ? AND ?
        `;
        
        const params = [start_date, end_date];
        
        if (account_id) {
            query += ' AND jel.account_id = ?';
            params.push(account_id);
        }
        
        query += ' ORDER BY je.entry_date, je.id, jel.id';
        
        const [ledger] = await pool.query(query, params);
        
        // Calculate running balance for each account
        const accountBalances = {};
        const ledgerWithBalance = ledger.map(entry => {
            const accountKey = `${entry.account_code} - ${entry.account_name}`;
            
            if (!accountBalances[accountKey]) {
                accountBalances[accountKey] = 0;
            }
            
            let balanceChange;
            if (entry.normal_balance === 'debit') {
                balanceChange = (parseFloat(entry.debit_amount) || 0) - (parseFloat(entry.credit_amount) || 0);
            } else {
                balanceChange = (parseFloat(entry.credit_amount) || 0) - (parseFloat(entry.debit_amount) || 0);
            }
            
            accountBalances[accountKey] += balanceChange;
            
            return {
                ...entry,
                running_balance: accountBalances[accountKey]
            };
        });
        
        res.json({
            success: true,
            data: ledgerWithBalance
        });
    } catch (error) {
        console.error('Error fetching general ledger:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch general ledger'
        });
    }
};

// Get trial balance
const getTrialBalance = async (req, res) => {
    try {
        const { as_of_date } = req.query;
        const date = as_of_date || moment().format('YYYY-MM-DD');
        
        const [accounts] = await pool.query(`
            SELECT 
                ca.id,
                ca.account_code,
                ca.account_name,
                ca.current_balance,
                at.normal_balance,
                at.category
            FROM chart_of_accounts ca
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE ca.is_active = TRUE
            ORDER BY ca.account_code
        `);
        
        let total_debit = 0;
        let total_credit = 0;
        
        const trialBalance = accounts.map(account => {
            const balance = parseFloat(account.current_balance) || 0;
            
            let debit_balance = 0;
            let credit_balance = 0;
            
            if (account.normal_balance === 'debit') {
                if (balance >= 0) {
                    debit_balance = balance;
                } else {
                    credit_balance = Math.abs(balance);
                }
            } else {
                if (balance >= 0) {
                    credit_balance = balance;
                } else {
                    debit_balance = Math.abs(balance);
                }
            }
            
            total_debit += debit_balance;
            total_credit += credit_balance;
            
            return {
                account_code: account.account_code,
                account_name: account.account_name,
                category: account.category,
                debit_balance: debit_balance.toFixed(2),
                credit_balance: credit_balance.toFixed(2)
            };
        });
        
        // Check if debit equals credit
        const isBalanced = Math.abs(total_debit - total_credit) < 0.01;
        
        res.json({
            success: true,
            data: {
                as_of_date: date,
                trial_balance: trialBalance,
                totals: {
                    total_debit: total_debit.toFixed(2),
                    total_credit: total_credit.toFixed(2),
                    difference: (total_debit - total_credit).toFixed(2)
                },
                is_balanced: isBalanced
            }
        });
    } catch (error) {
        console.error('Error fetching trial balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trial balance'
        });
    }
};

// Get income statement (Profit & Loss)
const getIncomeStatement = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        // Get revenue accounts
        const [revenues] = await pool.query(`
            SELECT 
                ca.account_code,
                ca.account_name,
                SUM(CASE 
                    WHEN at.normal_balance = 'credit' THEN jel.credit_amount - jel.debit_amount
                    ELSE jel.debit_amount - jel.credit_amount
                END) as amount
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            JOIN chart_of_accounts ca ON jel.account_id = ca.id
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE at.category = 'revenue'
                AND je.entry_date BETWEEN ? AND ?
            GROUP BY ca.id, ca.account_code, ca.account_name
            HAVING amount != 0
            ORDER BY ca.account_code
        `, [start_date, end_date]);
        
        // Get expense accounts
        const [expenses] = await pool.query(`
            SELECT 
                ca.account_code,
                ca.account_name,
                SUM(CASE 
                    WHEN at.normal_balance = 'debit' THEN jel.debit_amount - jel.credit_amount
                    ELSE jel.credit_amount - jel.debit_amount
                END) as amount
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            JOIN chart_of_accounts ca ON jel.account_id = ca.id
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE at.category = 'expense'
                AND je.entry_date BETWEEN ? AND ?
            GROUP BY ca.id, ca.account_code, ca.account_name
            HAVING amount != 0
            ORDER BY ca.account_code
        `, [start_date, end_date]);
        
        // Calculate totals
        const totalRevenue = revenues.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const netIncome = totalRevenue - totalExpenses;
        
        res.json({
            success: true,
            data: {
                period: {
                    start_date,
                    end_date
                },
                revenue: {
                    items: revenues,
                    total: totalRevenue
                },
                expenses: {
                    items: expenses,
                    total: totalExpenses
                },
                net_income: netIncome
            }
        });
    } catch (error) {
        console.error('Error fetching income statement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch income statement'
        });
    }
};

// Get balance sheet
const getBalanceSheet = async (req, res) => {
    try {
        const { as_of_date } = req.query;
        const date = as_of_date || moment().format('YYYY-MM-DD');
        
        // Get asset accounts
        const [assets] = await pool.query(`
            SELECT 
                ca.account_code,
                ca.account_name,
                ca.current_balance
            FROM chart_of_accounts ca
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE at.category = 'asset'
                AND ca.is_active = TRUE
            ORDER BY ca.account_code
        `);
        
        // Get liability accounts
        const [liabilities] = await pool.query(`
            SELECT 
                ca.account_code,
                ca.account_name,
                ca.current_balance
            FROM chart_of_accounts ca
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE at.category = 'liability'
                AND ca.is_active = TRUE
            ORDER BY ca.account_code
        `);
        
        // Get equity accounts
        const [equity] = await pool.query(`
            SELECT 
                ca.account_code,
                ca.account_name,
                ca.current_balance
            FROM chart_of_accounts ca
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE at.category = 'equity'
                AND ca.is_active = TRUE
            ORDER BY ca.account_code
        `);
        
        // Calculate totals
        const totalAssets = assets.reduce((sum, item) => sum + parseFloat(item.current_balance), 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + parseFloat(item.current_balance), 0);
        const totalEquity = equity.reduce((sum, item) => sum + parseFloat(item.current_balance), 0);
        const totalLiabilitiesEquity = totalLiabilities + totalEquity;
        
        res.json({
            success: true,
            data: {
                as_of_date: date,
                assets: {
                    items: assets,
                    total: totalAssets
                },
                liabilities: {
                    items: liabilities,
                    total: totalLiabilities
                },
                equity: {
                    items: equity,
                    total: totalEquity
                },
                totals: {
                    total_assets: totalAssets,
                    total_liabilities_equity: totalLiabilitiesEquity,
                    difference: totalAssets - totalLiabilitiesEquity,
                    is_balanced: Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01
                }
            }
        });
    } catch (error) {
        console.error('Error fetching balance sheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance sheet'
        });
    }
};

// Get account transactions
const getAccountTransactions = async (req, res) => {
    try {
        const { account_id } = req.params;
        const { start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                je.entry_date,
                je.entry_number,
                je.description as journal_description,
                jel.description as line_description,
                jel.debit_amount,
                jel.credit_amount,
                at.normal_balance,
                je.reference_type,
                je.reference_id
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            JOIN chart_of_accounts ca ON jel.account_id = ca.id
            JOIN account_types at ON ca.account_type_id = at.id
            WHERE jel.account_id = ?
        `;
        
        const params = [account_id];
        
        if (start_date && end_date) {
            query += ' AND je.entry_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }
        
        query += ' ORDER BY je.entry_date, je.id';
        
        const [transactions] = await pool.query(query, params);
        
        // Calculate running balance
        let runningBalance = 0;
        const transactionsWithBalance = transactions.map(transaction => {
            const debit = parseFloat(transaction.debit_amount) || 0;
            const credit = parseFloat(transaction.credit_amount) || 0;
            
            if (transaction.normal_balance === 'debit') {
                runningBalance += debit - credit;
            } else {
                runningBalance += credit - debit;
            }
            
            return {
                ...transaction,
                running_balance: runningBalance
            };
        });
        
        res.json({
            success: true,
            data: transactionsWithBalance
        });
    } catch (error) {
        console.error('Error fetching account transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account transactions'
        });
    }
};

// Create manual journal entry
const createManualJournalEntry = async (req, res) => {
    try {
        const { entry_date, description, lines } = req.body;
        const created_by = req.user.id;
        
        if (!entry_date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Entry date, description and at least two journal lines are required'
            });
        }
        
        const entryData = {
            entry_date,
            description,
            reference_type: 'manual_journal',
            reference_id: null,
            lines,
            created_by
        };
        
        const result = await createJournalEntry(entryData);
        
        res.status(201).json({
            success: true,
            message: 'Manual journal entry created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating manual journal entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create manual journal entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get account types
const getAccountTypes = async (req, res) => {
    try {
        const [accountTypes] = await pool.query(
            'SELECT * FROM account_types ORDER BY id ASC'
        );
        
        res.json({
            success: true,
            data: accountTypes
        });
    } catch (error) {
        console.error('Error fetching account types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account types'
        });
    }
};

// Add these functions to your existing accountingController.js

// Update account
const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            account_code, 
            account_name, 
            account_type_id, 
            parent_account_id, 
            description,
            is_active 
        } = req.body;

        // Check if account exists
        const [account] = await pool.query(
            'SELECT * FROM chart_of_accounts WHERE id = ?',
            [id]
        );

        if (account.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Check if account code already exists (excluding current account)
        if (account_code) {
            const [existing] = await pool.query(
                'SELECT id FROM chart_of_accounts WHERE account_code = ? AND id != ?',
                [account_code, id]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Account code already exists'
                });
            }
        }

        await pool.query(
            `UPDATE chart_of_accounts 
             SET account_code = COALESCE(?, account_code),
                 account_name = COALESCE(?, account_name),
                 account_type_id = COALESCE(?, account_type_id),
                 parent_account_id = ?,
                 description = COALESCE(?, description),
                 is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [
                account_code,
                account_name,
                account_type_id,
                parent_account_id || null,
                description,
                is_active,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Account updated successfully'
        });

    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update account'
        });
    }
};

// Delete account (soft delete)
const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if account has transactions
        const [transactions] = await pool.query(
            'SELECT COUNT(*) as count FROM journal_entry_lines WHERE account_id = ?',
            [id]
        );

        if (transactions[0].count > 0) {
            // Soft delete - just deactivate
            await pool.query(
                'UPDATE chart_of_accounts SET is_active = FALSE WHERE id = ?',
                [id]
            );

            return res.json({
                success: true,
                message: 'Account deactivated successfully (has transactions)'
            });
        }

        // Hard delete if no transactions
        await pool.query('DELETE FROM chart_of_accounts WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

// Get single account details
const getAccountDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [accounts] = await pool.query(`
            SELECT 
                ca.*,
                at.name as account_type_name,
                at.normal_balance,
                at.category,
                pca.account_name as parent_account_name,
                pca.account_code as parent_account_code
            FROM chart_of_accounts ca
            JOIN account_types at ON ca.account_type_id = at.id
            LEFT JOIN chart_of_accounts pca ON ca.parent_account_id = pca.id
            WHERE ca.id = ?
        `, [id]);

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Get recent transactions for this account
        const [transactions] = await pool.query(`
            SELECT 
                je.entry_date,
                je.entry_number,
                je.description,
                jel.debit_amount,
                jel.credit_amount,
                jel.description as line_description
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE jel.account_id = ?
            ORDER BY je.entry_date DESC
            LIMIT 10
        `, [id]);

        res.json({
            success: true,
            data: {
                account: accounts[0],
                recent_transactions: transactions
            }
        });

    } catch (error) {
        console.error('Error fetching account details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account details'
        });
    }
};

// Update journal entry
const updateJournalEntry = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { entry_date, description, lines } = req.body;

        // Check if journal entry exists and is manual
        const [existing] = await connection.query(
            'SELECT * FROM journal_entries WHERE id = ? AND reference_type = "manual_journal"',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found or cannot be edited'
            });
        }

        // Reverse old entry lines balances
        const [oldLines] = await connection.query(
            'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?',
            [id]
        );

        for (const line of oldLines) {
            const accountChange = (parseFloat(line.debit_amount) || 0) - (parseFloat(line.credit_amount) || 0);
            
            const [accountInfo] = await connection.query(`
                SELECT c.current_balance, t.normal_balance 
                FROM chart_of_accounts c
                JOIN account_types t ON c.account_type_id = t.id
                WHERE c.id = ?
            `, [line.account_id]);

            if (accountInfo.length > 0) {
                const currentBalance = parseFloat(accountInfo[0].current_balance) || 0;
                const normalBalance = accountInfo[0].normal_balance;

                let newBalance;
                if (normalBalance === 'debit') {
                    newBalance = currentBalance - accountChange;
                } else {
                    newBalance = currentBalance + accountChange;
                }

                await connection.query(
                    'UPDATE chart_of_accounts SET current_balance = ? WHERE id = ?',
                    [newBalance, line.account_id]
                );
            }
        }

        // Delete old lines
        await connection.query(
            'DELETE FROM journal_entry_lines WHERE journal_entry_id = ?',
            [id]
        );

        // Update journal entry header
        await connection.query(
            `UPDATE journal_entries 
             SET entry_date = ?, description = ?
             WHERE id = ?`,
            [entry_date, description, id]
        );

        // Calculate totals
        let total_debit = 0;
        let total_credit = 0;

        // Insert new lines and update balances
        for (const line of lines) {
            const debit = parseFloat(line.debit_amount) || 0;
            const credit = parseFloat(line.credit_amount) || 0;

            total_debit += debit;
            total_credit += credit;

            await connection.query(
                `INSERT INTO journal_entry_lines 
                (journal_entry_id, account_id, debit_amount, credit_amount, description)
                VALUES (?, ?, ?, ?, ?)`,
                [id, line.account_id, debit, credit, line.description || '']
            );

            const accountChange = debit - credit;

            const [accountInfo] = await connection.query(`
                SELECT c.current_balance, t.normal_balance 
                FROM chart_of_accounts c
                JOIN account_types t ON c.account_type_id = t.id
                WHERE c.id = ?
            `, [line.account_id]);

            if (accountInfo.length > 0) {
                const currentBalance = parseFloat(accountInfo[0].current_balance) || 0;
                const normalBalance = accountInfo[0].normal_balance;

                let newBalance;
                if (normalBalance === 'debit') {
                    newBalance = currentBalance + accountChange;
                } else {
                    newBalance = currentBalance - accountChange;
                }

                await connection.query(
                    'UPDATE chart_of_accounts SET current_balance = ? WHERE id = ?',
                    [newBalance, line.account_id]
                );

                await connection.query(
                    `INSERT INTO account_balances (account_id, date, balance, balance_type)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     balance = VALUES(balance),
                     balance_type = VALUES(balance_type)`,
                    [line.account_id, entry_date, Math.abs(newBalance), newBalance >= 0 ? 'debit' : 'credit']
                );
            }
        }

        // Update journal entry totals
        await connection.query(
            `UPDATE journal_entries 
             SET total_debit = ?, total_credit = ?
             WHERE id = ?`,
            [total_debit, total_credit, id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Journal entry updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating journal entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update journal entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Delete journal entry
const deleteJournalEntry = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if journal entry exists and is manual
        const [existing] = await connection.query(
            'SELECT * FROM journal_entries WHERE id = ? AND reference_type = "manual_journal"',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found or cannot be deleted'
            });
        }

        const entry = existing[0];

        // Reverse balances
        const [lines] = await connection.query(
            'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?',
            [id]
        );

        for (const line of lines) {
            const accountChange = (parseFloat(line.debit_amount) || 0) - (parseFloat(line.credit_amount) || 0);

            const [accountInfo] = await connection.query(`
                SELECT c.current_balance, t.normal_balance 
                FROM chart_of_accounts c
                JOIN account_types t ON c.account_type_id = t.id
                WHERE c.id = ?
            `, [line.account_id]);

            if (accountInfo.length > 0) {
                const currentBalance = parseFloat(accountInfo[0].current_balance) || 0;
                const normalBalance = accountInfo[0].normal_balance;

                let newBalance;
                if (normalBalance === 'debit') {
                    newBalance = currentBalance - accountChange;
                } else {
                    newBalance = currentBalance + accountChange;
                }

                await connection.query(
                    'UPDATE chart_of_accounts SET current_balance = ? WHERE id = ?',
                    [newBalance, line.account_id]
                );
            }
        }

        // Delete lines
        await connection.query(
            'DELETE FROM journal_entry_lines WHERE journal_entry_id = ?',
            [id]
        );

        // Delete entry
        await connection.query(
            'DELETE FROM journal_entries WHERE id = ?',
            [id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Journal entry deleted successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting journal entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete journal entry'
        });
    } finally {
        connection.release();
    }
};

// Export all new functions
module.exports = {
    createJournalEntry,
    getAllJournalEntries,
    getJournalEntryDetails,
    getChartOfAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountDetails,
    getGeneralLedger,
    getTrialBalance,
    getIncomeStatement,
    getBalanceSheet,
    getAccountTransactions,
    createManualJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getAccountTypes
};