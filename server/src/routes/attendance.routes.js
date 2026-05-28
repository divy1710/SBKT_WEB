const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/daily', authenticate, ctrl.getDailyAttendance);
router.get('/monthly-summary', authenticate, ctrl.getMonthlySummary);
router.get('/', authenticate, ctrl.getAttendance);
router.post('/', authenticate, authorize('ADMIN', 'HR_MANAGER'), ctrl.markAttendance);
router.put('/:id', authenticate, authorize('ADMIN', 'HR_MANAGER'), ctrl.updateAttendance);

module.exports = router;
