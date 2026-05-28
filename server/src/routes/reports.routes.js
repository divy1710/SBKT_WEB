const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const canView = ['ADMIN', 'ACCOUNTANT', 'HR_MANAGER', 'PURCHASE_MANAGER', 'STORE_MANAGER'];

router.get('/purchases', authenticate, authorize(...canView), ctrl.getPurchaseReport);
router.get('/attendance', authenticate, authorize(...canView), ctrl.getAttendanceReport);
router.get('/salary', authenticate, authorize(...canView), ctrl.getSalaryReport);
router.get('/inventory', authenticate, authorize(...canView), ctrl.getInventoryReport);

module.exports = router;
