const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/low-stock', authenticate, ctrl.getLowStock);
router.get('/', authenticate, ctrl.getInventory);
router.get('/:id', authenticate, ctrl.getInventoryItem);
router.get('/:id/transactions', authenticate, ctrl.getTransactions);
router.post('/outward', authenticate, authorize('ADMIN', 'STORE_MANAGER'), ctrl.createOutward);
router.put('/:id', authenticate, authorize('ADMIN', 'STORE_MANAGER'), ctrl.updateInventoryItem);

module.exports = router;
