const express = require('express');
const router = express.Router();
const { 
    createMillingRecord,
    getAllMillingRecords,
    getMillingRecordById,
    completeMillingProcess,
    deleteMillingRecord,
    getCompletedMillingRecords
} = require('../controllers/millingController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.post('/', authMiddleware, createMillingRecord);
router.get('/', authMiddleware, getAllMillingRecords);
router.get('/completed', authMiddleware, getCompletedMillingRecords);
router.get('/:id', authMiddleware, getMillingRecordById);
router.post('/:id/complete', authMiddleware, completeMillingProcess);
router.delete('/:id', authMiddleware, adminOnly, deleteMillingRecord);

module.exports = router;