const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salary.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', authenticate, ctrl.getSalaries);
router.get('/:id', authenticate, ctrl.getSalary);
router.post('/generate', authenticate, authorize('ADMIN', 'HR_MANAGER'), ctrl.generatePayroll);
router.put('/:id/approve', authenticate, authorize('ADMIN'), ctrl.approveSalary);
router.put('/:id/pay', authenticate, authorize('ADMIN', 'ACCOUNTANT'), ctrl.markSalaryPaid);

module.exports = router;
