const express = require('express');
const router = express.Router();
const { 
    getAllJournalEntries,
    getJournalEntryDetails,
    getChartOfAccounts,
    createAccount,
    getGeneralLedger,
    getTrialBalance,
    getIncomeStatement,
    getBalanceSheet,
    getAccountTransactions,
    createManualJournalEntry,
    getAccountTypes,
    getAccountDetails,
    updateAccount,
    deleteAccount,
    updateJournalEntry,
    deleteJournalEntry,
} = require('../controllers/accountingController');
const { authMiddleware } = require('../middleware/auth');
const { getFinancialDashboard, getAccountSummary } = require('../controllers/financialDashboardController');

// Account types
router.get('/account-types', authMiddleware, getAccountTypes);

// Chart of accounts
router.get('/accounts', authMiddleware, getChartOfAccounts);
router.post('/accounts', authMiddleware, createAccount);

// Journal entries
router.get('/journal-entries', authMiddleware, getAllJournalEntries);
router.get('/journal-entries/:id', authMiddleware, getJournalEntryDetails);
router.post('/journal-entries/manual', authMiddleware, createManualJournalEntry);

// Ledger and reports
router.get('/general-ledger', authMiddleware, getGeneralLedger);
router.get('/trial-balance', authMiddleware, getTrialBalance);
router.get('/income-statement', authMiddleware, getIncomeStatement);
router.get('/balance-sheet', authMiddleware, getBalanceSheet);
router.get('/accounts/:account_id/transactions', authMiddleware, getAccountTransactions);
router.get('/dashboard', authMiddleware, getFinancialDashboard);
router.get('/account-summary', authMiddleware, getAccountSummary);
router.get('/accounts/:id', authMiddleware, getAccountDetails);
router.put('/accounts/:id', authMiddleware, updateAccount);
router.delete('/accounts/:id', authMiddleware, deleteAccount);

// Journal entry management
router.put('/journal-entries/:id', authMiddleware, updateJournalEntry);
router.delete('/journal-entries/:id', authMiddleware, deleteJournalEntry);

module.exports = router;