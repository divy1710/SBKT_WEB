const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/purchase.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadMiddleware } = require('../middleware/upload.middleware');
const path = require('path');

const canManage = ['ADMIN', 'PURCHASE_MANAGER'];

router.get('/', authenticate, ctrl.getPurchases);
router.get('/:id', authenticate, ctrl.getPurchase);
router.post('/', authenticate, authorize(...canManage), [
  body('date').notEmpty(),
  body('supplierId').notEmpty(),
  body('invoiceNumber').notEmpty(),
  body('materialType').notEmpty(),
  body('quantity').isFloat({ min: 0.01 }),
  body('unit').notEmpty(),
  body('rate').isFloat({ min: 0 }),
  validate,
], ctrl.createPurchase);
router.put('/:id', authenticate, authorize(...canManage), ctrl.updatePurchase);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deletePurchase);

// Bill upload
router.post('/:id/bill',
  authenticate,
  authorize(...canManage),
  ...uploadMiddleware('bill', 'purchases'),
  ctrl.uploadBill
);

module.exports = router;
