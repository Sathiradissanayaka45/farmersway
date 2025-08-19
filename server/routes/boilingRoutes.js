const express = require('express');
const router = express.Router();
const { 
    createBoilingRecord,
    getAllBoilingRecords,
    deleteBoilingRecord,
    completeBoilingProcess,
    getBoilingRecordDetails,
    getCompletedBoilingRecords,
    updateMissingQuantityDetails,
    getBoilingCompletions,
    getMissingQuantities
} = require('../controllers/boilingController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.post('/', authMiddleware, createBoilingRecord);
router.get('/', authMiddleware, getAllBoilingRecords);
router.get('/completed', authMiddleware, getCompletedBoilingRecords);
router.get('/:id', authMiddleware, getBoilingRecordDetails);
router.delete('/:id', authMiddleware, adminOnly, deleteBoilingRecord);
router.post('/:id/complete', authMiddleware, completeBoilingProcess);
router.post('/:id/missing-quantities', authMiddleware, updateMissingQuantityDetails);
router.get('/:id/completions', authMiddleware, getBoilingCompletions);
router.get('/:id/missing-quantities', authMiddleware, getMissingQuantities);

module.exports = router;