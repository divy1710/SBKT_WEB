const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getGSTDetails } = require('../controllers/gst.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');



// Apply rate limiting to GST fetches to prevent API abuse and cost overruns
const gstLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { success: false, message: 'Too many GST fetches from this IP, please try again after 15 minutes.' }
});

// Protect route with authentication and restrict to specific roles
router.get('/:gstin', 
  authenticate, 
  authorize('ADMIN', 'PURCHASE_MANAGER'), 
  gstLimiter, 
  getGSTDetails
);

module.exports = router;
