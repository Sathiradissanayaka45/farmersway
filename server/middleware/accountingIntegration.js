const { createJournalEntry } = require('../controllers/accountingController');
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

const recordSalesAccounting = async (saleData, userId) => {
    console.log('========== RECORD SALES ACCOUNTING START ==========');
    console.log('Sale Data received:', JSON.stringify(saleData, null, 2));
    
    try {
        const { 
            saleId, 
            customerId, 
            customerName,
            quantityKg, 
            totalPrice, 
            paidAmount, 
            pendingAmount,
            paymentMethod,
            notes
        } = saleData;
        
        const entryData = {
            entry_date: new Date().toISOString().split('T')[0],
            description: `Sale of ${quantityKg}kg rice to ${customerName || `customer #${customerId}`}`,
            reference_type: 'sales',
            reference_id: saleId,
            created_by: userId,
            lines: []
        };
        
        if (notes) {
            entryData.description += ` - ${notes}`;
        }
        
        console.log('1. Getting required accounts...');
        
        // Get accounts
        const cashAccountId = await getPaymentMethodAccount('cash');
        const accountsReceivableId = await getAccountsReceivableAccount();
        const salesRevenueId = await getSalesRevenueAccount();
        
        console.log('   Accounts found:', {
            cash: cashAccountId,
            accountsReceivable: accountsReceivableId,
            salesRevenue: salesRevenueId
        });
        
        // 1. DEBIT entries (what we receive)
        if (paidAmount > 0 && pendingAmount > 0) {
            // Partial payment - debit both cash and accounts receivable
            if (cashAccountId) {
                entryData.lines.push({
                    account_id: cashAccountId,
                    debit_amount: paidAmount,
                    credit_amount: 0,
                    description: `Cash received from sale`
                });
            } else {
                console.warn('Cash account not found');
            }
            
            if (accountsReceivableId) {
                entryData.lines.push({
                    account_id: accountsReceivableId,
                    debit_amount: pendingAmount,
                    credit_amount: 0,
                    description: `Amount receivable from customer`
                });
            } else {
                console.warn('Accounts Receivable account not found');
            }
        } else if (pendingAmount > 0) {
            // No payment - all to accounts receivable
            if (accountsReceivableId) {
                entryData.lines.push({
                    account_id: accountsReceivableId,
                    debit_amount: totalPrice,
                    credit_amount: 0,
                    description: `Sale on credit`
                });
            } else {
                console.warn('Accounts Receivable account not found');
            }
        } else {
            // Full payment - debit cash
            if (cashAccountId) {
                entryData.lines.push({
                    account_id: cashAccountId,
                    debit_amount: totalPrice,
                    credit_amount: 0,
                    description: `Cash sale`
                });
            } else {
                console.warn('Cash account not found');
            }
        }
        
        // 2. CREDIT: Sales Revenue
        if (salesRevenueId) {
            entryData.lines.push({
                account_id: salesRevenueId,
                debit_amount: 0,
                credit_amount: totalPrice,
                description: 'Revenue from rice sales'
            });
        } else {
            console.warn('Sales Revenue account not found');
        }
        
        // Make sure we have at least 2 lines (debit and credit)
        if (entryData.lines.length < 2) {
            console.error('❌ Not enough accounts found for journal entry');
            return;
        }
        
        console.log('2. Journal entry data prepared:', JSON.stringify(entryData, null, 2));
        
        // Calculate totals
        const totalDebit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
        console.log(`3. Totals - Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ Journal entry unbalanced!');
            console.error(`Debit (${totalDebit}) must equal Credit (${totalCredit})`);
            return;
        }
        
        // Create the journal entry
        console.log('4. Calling createJournalEntry...');
        const result = await createJournalEntry(entryData);
        console.log('5. Journal entry created successfully:', result);
        
    } catch (error) {
        console.error('❌ Error recording sales accounting:', error);
        console.error('Error stack:', error.stack);
    } finally {
        console.log('========== RECORD SALES ACCOUNTING END ==========');
    }
};

// Integration for purchase transactions
const recordPurchaseAccounting = async (purchaseData, userId, customerAccountId) => {
    try {
        const { 
            purchaseId, 
            customerId, 
            customerName,
            quantityKg, 
            totalPrice, 
            paidAmount, 
            pendingAmount,
            paymentMethod,
            referenceNumber,
            notes,
            riceVarietyId
        } = purchaseData;
        
        const entryData = {
            entry_date: new Date().toISOString().split('T')[0],
            description: `Purchase of ${quantityKg}kg paddy from ${customerName}`,
            reference_type: 'purchase',
            reference_id: purchaseId,
            created_by: userId,
            lines: []
        };
        
        // Get necessary accounts
        const inventoryAccountId = await getInventoryAccount(riceVarietyId);
        const paymentAccountId = await getPaymentMethodAccount(paymentMethod);
        const accountsPayableId = await getAccountsPayableAccount();
        
        // 1. DEBIT: Inventory account (for the full purchase amount)
        if (inventoryAccountId) {
            entryData.lines.push({
                account_id: inventoryAccountId,
                debit_amount: totalPrice,
                credit_amount: 0,
                description: `Inventory increase from purchase`
            });
        }
        
        // 2. CREDIT: Payment account (for paid amount) and Accounts Payable (for pending amount)
        if (paidAmount > 0) {
            // Partially paid - credit payment method account
            if (paymentAccountId) {
                entryData.lines.push({
                    account_id: paymentAccountId,
                    debit_amount: 0,
                    credit_amount: paidAmount,
                    description: `Payment via ${paymentMethod}`
                });
            }
            
            // If there's pending amount, credit accounts payable
            if (pendingAmount > 0 && accountsPayableId) {
                entryData.lines.push({
                    account_id: accountsPayableId,
                    debit_amount: 0,
                    credit_amount: pendingAmount,
                    description: `Amount payable to ${customerName}`
                });
            }
        } else {
            // No payment - all to accounts payable
            if (accountsPayableId) {
                entryData.lines.push({
                    account_id: accountsPayableId,
                    debit_amount: 0,
                    credit_amount: totalPrice,
                    description: `Credit purchase from ${customerName}`
                });
            }
        }
        
        // If we have a customer account (Accounts Receivable - Customer), we could also record the 
        // contra entry, but typically for purchases, the customer is the supplier, so we use Accounts Payable
        
        // Ensure we have at least 2 lines
        if (entryData.lines.length < 2) {
            console.error('Missing accounts for journal entry');
            return;
        }
        
        // Calculate totals
        let totalDebit = 0, totalCredit = 0;
        entryData.lines.forEach(line => {
            totalDebit += parseFloat(line.debit_amount) || 0;
            totalCredit += parseFloat(line.credit_amount) || 0;
        });
        
        // Ensure debit equals credit
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('Journal entry unbalanced');
            return;
        }
        
        // Create the journal entry
        await createJournalEntry(entryData);
        
        console.log(`Journal entry created for purchase #${purchaseId}`);
        
    } catch (error) {
        console.error('Error recording purchase accounting:', error);
        // Don't throw - we don't want to fail the purchase if accounting fails
    }
};

// Integration for milling transactions
const recordMillingAccounting = async (millingData, userId) => {
    try {
        const { millingId, inputQuantity, outputQuantity, cost } = millingData;
        
        const entryData = {
            entry_date: new Date().toISOString().split('T')[0],
            description: `Milling of ${inputQuantity}kg paddy to ${outputQuantity}kg rice`,
            reference_type: 'milling',
            reference_id: millingId,
            created_by: userId,
            lines: []
        };
        
        // Debit: Inventory (Processed Rice) - output
        const [processedInvAccount] = await pool.query(
            "SELECT id FROM chart_of_accounts WHERE account_name LIKE '%Inventory - Processed Rice%' LIMIT 1"
        );
        
        // Credit: Inventory (Raw Paddy) - input
        const [rawInvAccount] = await pool.query(
            "SELECT id FROM chart_of_accounts WHERE account_name LIKE '%Inventory - Raw Paddy%' LIMIT 1"
        );
        
        if (processedInvAccount.length > 0 && rawInvAccount.length > 0) {
            // Transfer from raw to processed inventory
            // This requires you to have inventory valuation
            // For simplicity, we'll record at cost
            entryData.lines.push({
                account_id: processedInvAccount[0].id,
                debit_amount: cost || 0,
                credit_amount: 0,
                description: 'Milling output to inventory'
            });
            
            entryData.lines.push({
                account_id: rawInvAccount[0].id,
                debit_amount: 0,
                credit_amount: cost || 0,
                description: 'Raw material consumed in milling'
            });
        }
        
        await createJournalEntry(entryData);
        
    } catch (error) {
        console.error('Error recording milling accounting:', error);
    }
};

// Integration for boiling transactions
const recordBoilingAccounting = async (boilingData, userId) => {
    try {
        const { boilingId, inputQuantity, outputQuantity, cost } = boilingData;
        
        const entryData = {
            entry_date: new Date().toISOString().split('T')[0],
            description: `Boiling process costing`,
            reference_type: 'boiling',
            reference_id: boilingId,
            created_by: userId,
            lines: []
        };
        
        // Debit: Inventory (Processed Rice) - for additional value from boiling
        const [inventoryAccount] = await pool.query(
            "SELECT id FROM chart_of_accounts WHERE account_name LIKE '%Inventory - Processed Rice%' LIMIT 1"
        );
        
        // Credit: Boiling Charges Expense
        const [boilingExpenseAccount] = await pool.query(
            "SELECT id FROM chart_of_accounts WHERE account_name LIKE '%Boiling Charges%' LIMIT 1"
        );
        
        if (inventoryAccount.length > 0 && boilingExpenseAccount.length > 0) {
            entryData.lines.push({
                account_id: inventoryAccount[0].id,
                debit_amount: cost || 0,
                credit_amount: 0,
                description: 'Value added from boiling'
            });
            
            entryData.lines.push({
                account_id: boilingExpenseAccount[0].id,
                debit_amount: 0,
                credit_amount: cost || 0,
                description: 'Boiling process cost'
            });
        }
        
        await createJournalEntry(entryData);
        
    } catch (error) {
        console.error('Error recording boiling accounting:', error);
    }
};

// Integration for extra income
// middleware/accountingIntegration.js - Update recordExtraIncomeAccounting

const recordExtraIncomeAccounting = async (incomeData, userId) => {
    console.log('========== RECORD EXTRA INCOME ACCOUNTING START ==========');
    console.log('Income Data received:', JSON.stringify(incomeData, null, 2));
    
    const connection = await pool.getConnection();
    try {
        const { 
            incomeId, 
            incomeTypeId,
            incomeTypeName,
            amount, 
            description, 
            income_date,
            payment_method,
            payment_reference
        } = incomeData;
        
        // Get or create income account for this income type
        const incomeAccountId = await getOrCreateIncomeAccount(connection, incomeTypeId, incomeTypeName);
        
        // Get payment method account
        const paymentAccountId = await getPaymentMethodAccount(payment_method);
        
        if (!incomeAccountId) {
            console.error('❌ Income account not found/created');
            return;
        }
        
        if (!paymentAccountId) {
            console.error('❌ Payment account not found for method:', payment_method);
            return;
        }
        
        const entryData = {
            entry_date: income_date || new Date().toISOString().split('T')[0],
            description: description || `Extra income: ${incomeTypeName}`,
            reference_type: 'extra_income',
            reference_id: incomeId,
            created_by: userId,
            lines: [
                {
                    account_id: paymentAccountId,
                    debit_amount: amount,
                    credit_amount: 0,
                    description: `Payment received via ${payment_method}${payment_reference ? ` (Ref: ${payment_reference})` : ''}`
                },
                {
                    account_id: incomeAccountId,
                    debit_amount: 0,
                    credit_amount: amount,
                    description: `Income from ${incomeTypeName}`
                }
            ]
        };
        
        if (payment_reference) {
            entryData.description += ` - Ref: ${payment_reference}`;
        }
        
        console.log('Journal entry data prepared:', JSON.stringify(entryData, null, 2));
        
        // Calculate totals
        const totalDebit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ Journal entry unbalanced!');
            return;
        }
        
        // Create the journal entry
        const result = await createJournalEntry(entryData);
        console.log('Journal entry created successfully:', result);
        
    } catch (error) {
        console.error('❌ Error in recordExtraIncomeAccounting:', error);
        console.error('Error stack:', error.stack);
    } finally {
        connection.release();
        console.log('========== RECORD EXTRA INCOME ACCOUNTING END ==========');
    }
};

// Integration for extra expenses
// middleware/accountingIntegration.js - Update recordExtraExpenseAccounting

const recordExtraExpenseAccounting = async (expenseData, userId) => {
    console.log('========== RECORD EXTRA EXPENSE ACCOUNTING START ==========');
    console.log('Expense Data received:', JSON.stringify(expenseData, null, 2));
    
    const connection = await pool.getConnection();
    try {
        const { 
            expenseId, 
            expenseTypeId,
            expenseTypeName,
            amount, 
            description, 
            expense_date,
            payment_method,
            payment_reference
        } = expenseData;
        
        // Get or create expense account for this expense type
        const expenseAccountId = await getOrCreateExpenseAccount(connection, expenseTypeId, expenseTypeName);
        
        // Get payment method account
        const paymentAccountId = await getPaymentMethodAccount(payment_method);
        
        if (!expenseAccountId) {
            console.error('❌ Expense account not found/created');
            return;
        }
        
        if (!paymentAccountId) {
            console.error('❌ Payment account not found for method:', payment_method);
            return;
        }
        
        const entryData = {
            entry_date: expense_date || new Date().toISOString().split('T')[0],
            description: description || `Extra expense: ${expenseTypeName}`,
            reference_type: 'extra_expense',
            reference_id: expenseId,
            created_by: userId,
            lines: [
                {
                    account_id: expenseAccountId,
                    debit_amount: amount,
                    credit_amount: 0,
                    description: `Expense: ${expenseTypeName}`
                },
                {
                    account_id: paymentAccountId,
                    debit_amount: 0,
                    credit_amount: amount,
                    description: `Payment via ${payment_method}${payment_reference ? ` (Ref: ${payment_reference})` : ''}`
                }
            ]
        };
        
        if (payment_reference) {
            entryData.description += ` - Ref: ${payment_reference}`;
        }
        
        console.log('Journal entry data prepared:', JSON.stringify(entryData, null, 2));
        
        // Calculate totals
        const totalDebit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ Journal entry unbalanced!');
            return;
        }
        
        // Create the journal entry
        const result = await createJournalEntry(entryData);
        console.log('Journal entry created successfully:', result);
        
    } catch (error) {
        console.error('❌ Error in recordExtraExpenseAccounting:', error);
        console.error('Error stack:', error.stack);
    } finally {
        connection.release();
        console.log('========== RECORD EXTRA EXPENSE ACCOUNTING END ==========');
    }
};

// Integration for payment received
// middleware/accountingIntegration.js - recordPaymentReceivedAccounting (already correct)

const recordPaymentReceivedAccounting = async (paymentData, userId) => {
    console.log('========== RECORD PAYMENT RECEIVED ACCOUNTING START ==========');
    console.log('Payment Data received:', JSON.stringify(paymentData, null, 2));
    
    const connection = await pool.getConnection();
    try {
        const { 
            paymentId, 
            saleId,
            customerId, 
            customerName,
            amount, 
            paymentMethod,
            referenceNumber,
            notes
        } = paymentData;
        
        // Get account IDs
        console.log('1. Getting payment method account for:', paymentMethod);
        const paymentAccountId = await getPaymentMethodAccount(paymentMethod);
        console.log('   Payment account ID result:', paymentAccountId);
        
        console.log('2. Getting accounts receivable account');
        const accountsReceivableId = await getAccountsReceivableAccount();
        console.log('   Accounts Receivable ID result:', accountsReceivableId);
        
        if (!paymentAccountId) {
            console.error('❌ Payment account not found for method:', paymentMethod);
            return;
        }
        
        if (!accountsReceivableId) {
            console.error('❌ Accounts Receivable account not found');
            return;
        }
        
        const entryData = {
            entry_date: new Date().toISOString().split('T')[0],
            description: `Payment received from ${customerName || `customer #${customerId}`}${saleId ? ` for sale #${saleId}` : ''}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`,
            reference_type: 'payment_received',
            reference_id: paymentId,
            created_by: userId,
            lines: [
                {
                    account_id: paymentAccountId,
                    debit_amount: amount,
                    credit_amount: 0,
                    description: `Payment received via ${paymentMethod}`
                },
                {
                    account_id: accountsReceivableId,
                    debit_amount: 0,
                    credit_amount: amount,
                    description: `Reduction in accounts receivable from ${customerName || `customer #${customerId}`}`
                }
            ]
        };
        
        if (notes) {
            entryData.description += ` - ${notes}`;
        }
        
        console.log('3. Journal entry data prepared:', JSON.stringify(entryData, null, 2));
        
        // Calculate totals for verification
        const totalDebit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
        console.log(`4. Totals - Debit: ${totalDebit}, Credit: ${totalCredit}`);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ Journal entry unbalanced!');
            return;
        }
        
        // Create the journal entry
        console.log('5. Calling createJournalEntry...');
        const result = await createJournalEntry(entryData);
        console.log('6. Journal entry created successfully:', result);
        
    } catch (error) {
        console.error('❌ Error in recordPaymentReceivedAccounting:', error);
        console.error('Error stack:', error.stack);
    } finally {
        connection.release();
        console.log('========== RECORD PAYMENT RECEIVED ACCOUNTING END ==========');
    }
};

const getAccountsReceivableAccount = async () => {
    const connection = await pool.getConnection();
    try {
        const [accounts] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN account_types at ON ca.account_type_id = at.id
             WHERE at.category = 'asset' 
               AND (ca.account_name LIKE '%Accounts Receivable%' 
                    OR ca.account_name LIKE '%Receivable%')
               AND ca.is_active = 1
             LIMIT 1`
        );
        
        if (accounts.length === 0) {
            const [accountType] = await connection.query(
                "SELECT id FROM account_types WHERE category = 'asset' LIMIT 1"
            );
            
            if (accountType.length > 0) {
                const [result] = await connection.query(
                    `INSERT INTO chart_of_accounts 
                    (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
                    VALUES (?, ?, ?, ?, 0, 0, 1)`,
                    ['1100', 'Accounts Receivable', accountType[0].id, 'Amounts owed by customers']
                );
                return result.insertId;
            }
        }
        
        return accounts.length > 0 ? accounts[0].id : null;
    } finally {
        connection.release();
    }
};

const recordPaymentMadeAccounting = async (paymentData, userId) => {
    console.log('========== RECORD PAYMENT ACCOUNTING START ==========');
    console.log('Payment Data received:', JSON.stringify(paymentData, null, 2));
    
    const connection = await pool.getConnection();
    try {
        const { 
            paymentId, 
            purchaseId,
            supplierId, 
            supplierName,
            amount, 
            paymentMethod,
            referenceNumber,
            notes
        } = paymentData;
        
        if (!amount || amount <= 0) {
            console.error('Invalid amount:', amount);
            return;
        }
        
        // Get account IDs
        console.log('1. Getting payment method account for:', paymentMethod);
        const paymentAccountId = await getPaymentMethodAccount(paymentMethod);
        console.log('   Payment account ID result:', paymentAccountId);
        
        console.log('2. Getting accounts payable account');
        const accountsPayableId = await getAccountsPayableAccount();
        console.log('   Accounts Payable ID result:', accountsPayableId);
        
        if (!paymentAccountId) {
            console.error('❌ Payment account not found for method:', paymentMethod);
            return;
        }
        
        if (!accountsPayableId) {
            console.error('❌ Accounts Payable account not found');
            return;
        }
        
        // Prepare journal entry data
        const entryData = {
            entry_date: new Date().toISOString().split('T')[0],
            description: `Payment to ${supplierName || 'supplier'}${purchaseId ? ` for purchase #${purchaseId}` : ''}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`,
            reference_type: 'payment_made',
            reference_id: paymentId,
            created_by: userId,
            lines: [
                {
                    account_id: accountsPayableId,
                    debit_amount: parseFloat(amount),
                    credit_amount: 0,
                    description: `Reduction in accounts payable to ${supplierName || 'supplier'}`
                },
                {
                    account_id: paymentAccountId,
                    debit_amount: 0,
                    credit_amount: parseFloat(amount),
                    description: `Payment made via ${paymentMethod}`
                }
            ]
        };
        
        if (notes) {
            entryData.description += ` - ${notes}`;
        }
        
        console.log('3. Journal entry data prepared:', JSON.stringify(entryData, null, 2));
        
        // Calculate totals for verification
        const totalDebit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
        console.log(`4. Totals - Debit: ${totalDebit}, Credit: ${totalCredit}`);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ Journal entry unbalanced!');
            return;
        }
        
        // Create the journal entry
        console.log('5. Calling createJournalEntry...');
        const result = await createJournalEntry(entryData);
        console.log('6. Journal entry created successfully:', result);
        
    } catch (error) {
        console.error('❌ Error in recordPaymentMadeAccounting:', error);
        console.error('Error stack:', error.stack);
    } finally {
        connection.release();
        console.log('========== RECORD PAYMENT ACCOUNTING END ==========');
    }
};

const getPaymentMethodAccount = async (paymentMethod) => {
    const connection = await pool.getConnection();
    try {
        console.log(`   Looking up account for payment method: ${paymentMethod}`);
        
        let accountQuery = '';
        let params = [];
        
        switch(paymentMethod?.toLowerCase()) {
            case 'cash':
                accountQuery = "SELECT id FROM chart_of_accounts WHERE (account_name LIKE '%Cash%' OR account_code = '1000') AND is_active = 1 LIMIT 1";
                break;
            case 'bank_transfer':
                accountQuery = "SELECT id FROM chart_of_accounts WHERE (account_name LIKE '%Bank%' OR account_code = '1010') AND is_active = 1 LIMIT 1";
                break;
            case 'mobile_payment':
                accountQuery = "SELECT id FROM chart_of_accounts WHERE (account_name LIKE '%Mobile%' OR account_name LIKE '%Digital%' OR account_name LIKE '%Mobile Money%') AND is_active = 1 LIMIT 1";
                break;
            case 'cheque':
                accountQuery = "SELECT id FROM chart_of_accounts WHERE (account_name LIKE '%Cheque%' OR account_name LIKE '%Bank%') AND is_active = 1 LIMIT 1";
                break;
            default:
                accountQuery = "SELECT id FROM chart_of_accounts WHERE (account_name LIKE '%Cash%' OR account_code = '1000') AND is_active = 1 LIMIT 1";
        }
        
        const [accounts] = await connection.query(accountQuery, params);
        console.log(`   Found ${accounts.length} accounts for payment method`);
        
        if (accounts.length > 0) {
            console.log(`   Using account ID: ${accounts[0].id}`);
            return accounts[0].id;
        }
        
        // Fallback to any asset account
        console.log('   No specific account found, trying any asset account');
        const [defaultAccounts] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN account_types at ON ca.account_type_id = at.id
             WHERE at.category = 'asset' AND ca.is_active = 1
             LIMIT 1`
        );
        
        if (defaultAccounts.length > 0) {
            console.log(`   Using fallback asset account ID: ${defaultAccounts[0].id}`);
            return defaultAccounts[0].id;
        }
        
        console.error('   No asset accounts found at all!');
        return null;
    } finally {
        connection.release();
    }
};

const getInventoryAccount = async (riceVarietyId) => {
    const connection = await pool.getConnection();
    try {
        // First check if there's a specific inventory account for this rice variety
        const [accounts] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN rice_varieties rv ON ca.id = rv.inventory_account_id
             WHERE rv.id = ?`,
            [riceVarietyId]
        );
        
        if (accounts.length > 0) {
            return accounts[0].id;
        }
        
        // Fallback to general inventory account
        const [generalAccounts] = await connection.query(
            "SELECT id FROM chart_of_accounts WHERE (account_name LIKE '%Inventory%' OR account_code LIKE '12%') AND is_active = 1 LIMIT 1"
        );
        
        return generalAccounts.length > 0 ? generalAccounts[0].id : null;
    } finally {
        connection.release();
    }
};

// Get accounts payable account
const getAccountsPayableAccount = async () => {
    const connection = await pool.getConnection();
    try {
        console.log('   Looking up Accounts Payable account');
        
        const [accounts] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN account_types at ON ca.account_type_id = at.id
             WHERE at.category = 'liability' 
               AND (ca.account_name LIKE '%Accounts Payable%' 
                    OR ca.account_name LIKE '%Payable%'
                    OR ca.account_code = '2000')
               AND ca.is_active = 1
             LIMIT 1`
        );
        
        if (accounts.length > 0) {
            console.log(`   Found Accounts Payable ID: ${accounts[0].id}`);
            return accounts[0].id;
        }
        
        console.log('   No Accounts Payable found, trying any liability account');
        const [liabilityAccounts] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN account_types at ON ca.account_type_id = at.id
             WHERE at.category = 'liability' AND ca.is_active = 1
             LIMIT 1`
        );
        
        if (liabilityAccounts.length > 0) {
            console.log(`   Using liability account ID: ${liabilityAccounts[0].id}`);
            return liabilityAccounts[0].id;
        }
        
        console.error('   No liability accounts found!');
        return null;
    } finally {
        connection.release();
    }
};

const getSalesRevenueAccount = async () => {
    const connection = await pool.getConnection();
    try {
        const [accounts] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN account_types at ON ca.account_type_id = at.id
             WHERE at.category = 'revenue' 
               AND (ca.account_name LIKE '%Sales%' 
                    OR ca.account_name LIKE '%Revenue%'
                    OR ca.account_name LIKE '%Rice Sales%')
               AND ca.is_active = 1
             LIMIT 1`
        );
        
        if (accounts.length === 0) {
            // Try to find any revenue account
            const [revenueAccounts] = await connection.query(
                `SELECT ca.id FROM chart_of_accounts ca
                 JOIN account_types at ON ca.account_type_id = at.id
                 WHERE at.category = 'revenue' AND ca.is_active = 1
                 LIMIT 1`
            );
            
            if (revenueAccounts.length > 0) {
                return revenueAccounts[0].id;
            }
            
            // Create default sales revenue account if none exists
            const [accountType] = await connection.query(
                "SELECT id FROM account_types WHERE category = 'revenue' LIMIT 1"
            );
            
            if (accountType.length > 0) {
                const [result] = await connection.query(
                    `INSERT INTO chart_of_accounts 
                    (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
                    VALUES (?, ?, ?, ?, 0, 0, 1)`,
                    ['4000', 'Sales Revenue', accountType[0].id, 'Revenue from rice sales']
                );
                return result.insertId;
            }
        }
        
        return accounts.length > 0 ? accounts[0].id : null;
    } finally {
        connection.release();
    }
};
const getProcessedRiceInventoryAccount = async () => {
    const connection = await pool.getConnection();
    try {
        const [accounts] = await connection.query(
            `SELECT id FROM chart_of_accounts 
             WHERE (account_name LIKE '%Processed Rice%' 
                    OR account_name LIKE '%Inventory - Processed%'
                    OR (account_name LIKE '%Inventory%' AND account_name LIKE '%Rice%'))
               AND is_active = 1
             LIMIT 1`
        );
        
        if (accounts.length > 0) {
            return accounts[0].id;
        }
        
        // Fallback to general inventory account
        const [generalAccounts] = await connection.query(
            "SELECT id FROM chart_of_accounts WHERE account_name LIKE '%Inventory%' AND is_active = 1 LIMIT 1"
        );
        
        return generalAccounts.length > 0 ? generalAccounts[0].id : null;
    } finally {
        connection.release();
    }
};
const getCOGSAccount = async () => {
    const connection = await pool.getConnection();
    try {
        const [accounts] = await connection.query(
            `SELECT ca.id FROM chart_of_accounts ca
             JOIN account_types at ON ca.account_type_id = at.id
             WHERE at.category = 'expense' 
               AND (ca.account_name LIKE '%Cost of Goods Sold%' 
                    OR ca.account_name LIKE '%COGS%')
               AND ca.is_active = 1
             LIMIT 1`
        );
        
        if (accounts.length === 0) {
            // Create default COGS account if none exists
            const [accountType] = await connection.query(
                "SELECT id FROM account_types WHERE category = 'expense' LIMIT 1"
            );
            
            if (accountType.length > 0) {
                const [result] = await connection.query(
                    `INSERT INTO chart_of_accounts 
                    (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
                    VALUES (?, ?, ?, ?, 0, 0, 1)`,
                    ['5000', 'Cost of Goods Sold', accountType[0].id, 'Cost of rice sold']
                );
                return result.insertId;
            }
        }
        
        return accounts.length > 0 ? accounts[0].id : null;
    } finally {
        connection.release();
    }
};
// middleware/accountingIntegration.js - Add these functions

// Get or create expense account for expense type
const getOrCreateExpenseAccount = async (connection, expenseTypeId, expenseTypeName) => {
    try {
        // Check if expense type already has an account
        const [existing] = await connection.query(
            'SELECT account_id FROM expense_types WHERE id = ?',
            [expenseTypeId]
        );

        if (existing.length > 0 && existing[0].account_id) {
            return existing[0].account_id;
        }

        // Create new expense account
        const accountCode = `EXP-${String(expenseTypeId).padStart(4, '0')}`;
        const accountName = `Expense - ${expenseTypeName}`;

        // Get expense account type ID
        const [accountType] = await connection.query(
            "SELECT id FROM account_types WHERE category = 'expense' LIMIT 1"
        );

        if (accountType.length === 0) {
            console.error('No expense account type found');
            return null;
        }

        const [result] = await connection.query(
            `INSERT INTO chart_of_accounts 
            (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
            VALUES (?, ?, ?, ?, 0, 0, 1)`,
            [accountCode, accountName, accountType[0].id, `Expenses for ${expenseTypeName}`]
        );

        const accountId = result.insertId;

        // Update expense type with account_id
        await connection.query(
            'UPDATE expense_types SET account_id = ? WHERE id = ?',
            [accountId, expenseTypeId]
        );

        return accountId;
    } catch (error) {
        console.error('Error creating expense account:', error);
        throw error;
    }
};

// Get or create income account for income type
const getOrCreateIncomeAccount = async (connection, incomeTypeId, incomeTypeName) => {
    try {
        // Check if income type already has an account
        const [existing] = await connection.query(
            'SELECT account_id FROM income_types WHERE id = ?',
            [incomeTypeId]
        );

        if (existing.length > 0 && existing[0].account_id) {
            return existing[0].account_id;
        }

        // Create new income account
        const accountCode = `INC-${String(incomeTypeId).padStart(4, '0')}`;
        const accountName = `Income - ${incomeTypeName}`;

        // Get income account type ID
        const [accountType] = await connection.query(
            "SELECT id FROM account_types WHERE category = 'revenue' LIMIT 1"
        );

        if (accountType.length === 0) {
            console.error('No revenue account type found');
            return null;
        }

        const [result] = await connection.query(
            `INSERT INTO chart_of_accounts 
            (account_code, account_name, account_type_id, description, opening_balance, current_balance, is_active)
            VALUES (?, ?, ?, ?, 0, 0, 1)`,
            [accountCode, accountName, accountType[0].id, `Income from ${incomeTypeName}`]
        );

        const accountId = result.insertId;

        // Update income type with account_id
        await connection.query(
            'UPDATE income_types SET account_id = ? WHERE id = ?',
            [accountId, incomeTypeId]
        );

        return accountId;
    } catch (error) {
        console.error('Error creating income account:', error);
        throw error;
    }
};

// middleware/accountingIntegration.js - Add reverse functions

// Reverse accounting entry for deleted expense
const reverseExtraExpenseAccounting = async (expenseData, userId) => {
    console.log('========== REVERSE EXTRA EXPENSE ACCOUNTING START ==========');
    console.log('Reverse Expense Data received:', JSON.stringify(expenseData, null, 2));
    
    const connection = await pool.getConnection();
    try {
        const { 
            expenseId, 
            expenseTypeId,
            expenseTypeName,
            amount, 
            description, 
            expense_date,
            payment_method,
            payment_reference,
            deleted_by
        } = expenseData;
        
        // Get expense account (should already exist)
        const [expenseAccount] = await connection.query(
            'SELECT account_id FROM expense_types WHERE id = ?',
            [expenseTypeId]
        );

        if (expenseAccount.length === 0 || !expenseAccount[0].account_id) {
            console.error('❌ Expense account not found');
            return;
        }
        
        // Get payment method account
        const paymentAccountId = await getPaymentMethodAccount(payment_method);
        
        if (!paymentAccountId) {
            console.error('❌ Payment account not found for method:', payment_method);
            return;
        }
        
        // Format the date properly
        let formattedDate;
        if (expense_date instanceof Date) {
            formattedDate = expense_date.toISOString().split('T')[0];
        } else if (typeof expense_date === 'string') {
            formattedDate = expense_date.split('T')[0];
        } else {
            formattedDate = new Date().toISOString().split('T')[0];
        }
        
        // Create REVERSING journal entry
        // Original: Debit Expense, Credit Cash
        // Reverse:  Credit Expense, Debit Cash
        const entryData = {
            entry_date: formattedDate,
            description: `REVERSAL: Deleted expense - ${expenseTypeName}${description ? ` (${description})` : ''}`,
            reference_type: 'extra_expense_reversal',
            reference_id: expenseId,
            created_by: userId,
            lines: [
                {
                    account_id: paymentAccountId,
                    debit_amount: amount,
                    credit_amount: 0,
                    description: `Reversal: Cash refund from deleted expense`
                },
                {
                    account_id: expenseAccount[0].account_id,
                    debit_amount: 0,
                    credit_amount: amount,
                    description: `Reversal: Reversed expense for ${expenseTypeName}`
                }
            ]
        };
        
        if (payment_reference) {
            entryData.description += ` - Original Ref: ${payment_reference}`;
        }
        
        console.log('Reversal journal entry data prepared:', JSON.stringify(entryData, null, 2));
        
        // Calculate totals
        const totalDebit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ Reversal journal entry unbalanced!');
            return;
        }
        
        // Create the reversal journal entry
        const result = await createJournalEntry(entryData);
        console.log('Reversal journal entry created successfully:', result);
        
    } catch (error) {
        console.error('❌ Error in reverseExtraExpenseAccounting:', error);
        console.error('Error stack:', error.stack);
    } finally {
        connection.release();
        console.log('========== REVERSE EXTRA EXPENSE ACCOUNTING END ==========');
    }
};

// Reverse accounting entry for deleted income
const reverseExtraIncomeAccounting = async (incomeData, userId) => {
    console.log('========== REVERSE EXTRA INCOME ACCOUNTING START ==========');
    console.log('Reverse Income Data received:', JSON.stringify(incomeData, null, 2));
    
    const connection = await pool.getConnection();
    try {
        const { 
            incomeId, 
            incomeTypeId,
            incomeTypeName,
            amount, 
            description, 
            income_date,
            payment_method,
            payment_reference,
            deleted_by
        } = incomeData;
        
        // Get income account (should already exist)
        const [incomeAccount] = await connection.query(
            'SELECT account_id FROM income_types WHERE id = ?',
            [incomeTypeId]
        );

        if (incomeAccount.length === 0 || !incomeAccount[0].account_id) {
            console.error('❌ Income account not found');
            return;
        }
        
        // Get payment method account
        const paymentAccountId = await getPaymentMethodAccount(payment_method);
        
        if (!paymentAccountId) {
            console.error('❌ Payment account not found for method:', payment_method);
            return;
        }
        
        // Format the date properly
        let formattedDate;
        if (income_date instanceof Date) {
            formattedDate = income_date.toISOString().split('T')[0];
        } else if (typeof income_date === 'string') {
            formattedDate = income_date.split('T')[0];
        } else {
            formattedDate = new Date().toISOString().split('T')[0];
        }
        
        // Create REVERSING journal entry
        // Original: Debit Cash, Credit Income
        // Reverse:  Credit Cash, Debit Income
        const entryData = {
            entry_date: formattedDate,
            description: `REVERSAL: Deleted income - ${incomeTypeName}${description ? ` (${description})` : ''}`,
            reference_type: 'extra_income_reversal',
            reference_id: incomeId,
            created_by: userId,
            lines: [
                {
                    account_id: incomeAccount[0].account_id,
                    debit_amount: amount,
                    credit_amount: 0,
                    description: `Reversal: Reversed income for ${incomeTypeName}`
                },
                {
                    account_id: paymentAccountId,
                    debit_amount: 0,
                    credit_amount: amount,
                    description: `Reversal: Cash returned from deleted income`
                }
            ]
        };
        
        if (payment_reference) {
            entryData.description += ` - Original Ref: ${payment_reference}`;
        }
        
        console.log('Reversal journal entry data prepared:', JSON.stringify(entryData, null, 2));
        
        // Calculate totals
        const totalDebit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ Reversal journal entry unbalanced!');
            return;
        }
        
        // Create the reversal journal entry
        const result = await createJournalEntry(entryData);
        console.log('Reversal journal entry created successfully:', result);
        
    } catch (error) {
        console.error('❌ Error in reverseExtraIncomeAccounting:', error);
        console.error('Error stack:', error.stack);
    } finally {
        connection.release();
        console.log('========== REVERSE EXTRA INCOME ACCOUNTING END ==========');
    }
};

module.exports = {
    recordSalesAccounting,
    recordPurchaseAccounting,
    recordMillingAccounting,
    recordBoilingAccounting,
    recordExtraIncomeAccounting,
    recordExtraExpenseAccounting,
    recordPaymentReceivedAccounting,
    recordPaymentMadeAccounting,
    getPaymentMethodAccount,
    getAccountsReceivableAccount,
    getAccountsPayableAccount,
    getSalesRevenueAccount,
    getProcessedRiceInventoryAccount,
    getCOGSAccount,
    getOrCreateExpenseAccount,
    getOrCreateIncomeAccount,
    reverseExtraIncomeAccounting,
    reverseExtraExpenseAccounting,
};