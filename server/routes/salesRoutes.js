const express = require('express');
const router = express.Router();
const { 
    createSellingCustomer,
    getAllSellingCustomers,
    getSellingCustomerById,
    createRiceSale,
    getAllRiceSales,
    getSalesByCustomer,
    recordSalePayment,
    getSalePayments,
    recordCustomerPayment
} = require('../controllers/salesController');
const { authMiddleware } = require('../middleware/auth');

// Customer routes
router.post('/customers', authMiddleware, createSellingCustomer);
router.get('/customers', authMiddleware, getAllSellingCustomers);
router.get('/customers/:id', authMiddleware, getSellingCustomerById);
router.get('/customers/:id/payments', authMiddleware, getSalePayments);

// Sales routes
router.post('/', authMiddleware, createRiceSale);
router.get('/', authMiddleware, getAllRiceSales);
router.get('/customer/:customerId', authMiddleware, getSalesByCustomer);
router.post('/:saleId/payments', authMiddleware, recordSalePayment);
router.post('/customers/:customerId/payments', authMiddleware, recordCustomerPayment);

module.exports = router;