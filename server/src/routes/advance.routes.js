const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/advance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', authenticate, ctrl.getAdvances);
router.post('/', authenticate, authorize('ADMIN', 'HR_MANAGER', 'ACCOUNTANT'), ctrl.createAdvance);
router.put('/:id', authenticate, authorize('ADMIN', 'HR_MANAGER'), ctrl.updateAdvance);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteAdvance);

module.exports = router;
