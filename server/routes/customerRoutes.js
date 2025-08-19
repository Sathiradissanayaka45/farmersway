const express = require('express');
const router = express.Router();
const { 
    getAllCustomers,
    getCustomerById,
    recordPayment
} = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getAllCustomers);
router.get('/:id', authMiddleware, getCustomerById);
router.post('/:id/payments', authMiddleware, recordPayment);

module.exports = router;