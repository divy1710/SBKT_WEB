const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadMiddleware } = require('../middleware/upload.middleware');

const canManage = ['ADMIN', 'HR_MANAGER'];

router.get('/list', authenticate, ctrl.getEmployeesList);
router.get('/', authenticate, ctrl.getEmployees);
router.get('/:id', authenticate, ctrl.getEmployee);
router.post('/', authenticate, authorize(...canManage),
  ...uploadMiddleware('photo', 'employees'),
  ctrl.createEmployee
);
router.put('/:id', authenticate, authorize(...canManage),
  ...uploadMiddleware('photo', 'employees'),
  ctrl.updateEmployee
);
router.delete('/:id', authenticate, authorize(...canManage), ctrl.deleteEmployee);

module.exports = router;
