const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const uploadMiddleware = require('../middleware/upload.middleware');
const { protect, authorize } = require('../middleware/auth.middleware');

// Note: Ensure your authentication middleware correctly verifies the JWT
// and sets req.user

// Upload Purchase Bill
router.post(
  '/purchase-bill',
  protect,
  authorize('ADMIN', 'PURCHASE_MANAGER', 'ACCOUNTANT'),
  uploadMiddleware.uploadPurchaseBill,
  uploadMiddleware.handleUploadError,
  uploadController.uploadPurchaseBill
);

// Upload Employee Document
router.post(
  '/employee-document',
  protect,
  authorize('ADMIN', 'HR_MANAGER'),
  uploadMiddleware.uploadEmployeeDocument,
  uploadMiddleware.handleUploadError,
  uploadController.uploadEmployeeDocument
);

// Delete File
router.delete(
  '/:fileId',
  protect,
  authorize('ADMIN', 'PURCHASE_MANAGER', 'HR_MANAGER', 'ACCOUNTANT'),
  uploadController.deleteFile
);

// View File (Secure Streaming)
// Only authenticated users can view files
router.get(
  '/view/:fileId',
  protect,
  uploadController.viewFile
);

module.exports = router;
