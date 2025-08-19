const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/extraTransactionsController');
const { authMiddleware } = require('../middleware/auth');

// Income type routes
router.post('/income-types', authMiddleware, createIncomeType);
router.get('/income-types', authMiddleware, getAllIncomeTypes);

// Income routes
router.post('/income', authMiddleware, recordExtraIncome);
router.get('/income', authMiddleware, getAllExtraIncome);
router.put('/income/:id', authMiddleware, updateIncomeRecord);
router.delete('/income/:id', authMiddleware, softDeleteIncome);

// Expense type routes
router.post('/expense-types', authMiddleware, createExpenseType);
router.get('/expense-types', authMiddleware, getAllExpenseTypes);

// Expense routes
router.post('/expenses', authMiddleware, recordExtraExpense);
router.get('/expenses', authMiddleware, getAllExtraExpenses);
router.put('/expenses/:id', authMiddleware, updateExpenseRecord);
router.delete('/expenses/:id', authMiddleware, softDeleteExpense);

// Reports
router.get('/summary', authMiddleware, getIncomeExpenseSummary);
router.get('/financial-report', authMiddleware, getFinancialReport);
router.get('/dashboard', authMiddleware, getDashboardData);
module.exports = router;