const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/supplier.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');

const canManage = ['ADMIN', 'PURCHASE_MANAGER'];

router.get('/list', authenticate, ctrl.getSuppliersList);
router.get('/', authenticate, ctrl.getSuppliers);
router.get('/:id', authenticate, ctrl.getSupplier);
router.post('/', authenticate, authorize(...canManage), [
  body('name').notEmpty().withMessage('Supplier name required'),
  body('phone').notEmpty().withMessage('Phone required'),
  body('address').notEmpty().withMessage('Address required'),
  validate,
], ctrl.createSupplier);
router.put('/:id', authenticate, authorize(...canManage), ctrl.updateSupplier);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteSupplier);

module.exports = router;
