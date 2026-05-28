const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, getMe, changePassword, getUsers, createUser, updateUser } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
], login);

router.get('/me', authenticate, getMe);

router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], changePassword);

// User management — Admin only
router.get('/users', authenticate, authorize('ADMIN'), getUsers);
router.post('/users', authenticate, authorize('ADMIN'), [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['ADMIN', 'PURCHASE_MANAGER', 'HR_MANAGER', 'ACCOUNTANT', 'STORE_MANAGER']),
  validate,
], createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), updateUser);

module.exports = router;
