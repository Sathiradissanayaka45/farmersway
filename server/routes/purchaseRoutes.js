const express = require('express');
const router = express.Router();
const { 
    createPurchase,
    getAllPurchases,
    getPurchasesByCustomer,
    recordOrderPayment
} = require('../controllers/purchaseController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.post('/', authMiddleware, createPurchase);
router.get('/', authMiddleware, getAllPurchases);
router.get('/customer/:customerId', authMiddleware, getPurchasesByCustomer);
router.post('/:purchaseId/payments', authMiddleware, recordOrderPayment);

module.exports = router;