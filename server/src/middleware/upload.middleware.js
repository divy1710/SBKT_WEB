const multer = require('multer');

// Configure multer to use memory storage
// This means the file will be stored in memory as a Buffer, which is perfect for streaming to Google Drive
const storage = multer.memoryStorage();

// Define allowed mime types
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

// Define dangerous extensions to double check
const dangerousExtensions = ['.exe', '.bat', '.sh', '.js', '.vbs', '.scr', '.zip'];

/**
 * File filter to validate mime types and extensions
 */
const fileFilter = (req, file, cb) => {
  // Check mime type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'), false);
  }

  // Check file extension just to be safe
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return cb(new Error('Dangerous file types are not allowed.'), false);
  }

  cb(null, true);
};

/**
 * Create multer upload middleware with dynamic size limits
 * @param {Number} maxImageSize - Max size for images in bytes (default 5MB)
 * @param {Number} maxPdfSize - Max size for PDFs in bytes (default 10MB)
 */
const createUploadMiddleware = (maxImageSize = 5 * 1024 * 1024, maxPdfSize = 10 * 1024 * 1024) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      // We set the absolute max to the larger of the two limits here,
      // and we can perform more specific checks in the controller if needed.
      fileSize: Math.max(maxImageSize, maxPdfSize) 
    }
  });
};

// Export pre-configured middlewares for convenience
const uploadPurchaseBill = createUploadMiddleware(5 * 1024 * 1024, 10 * 1024 * 1024).single('file');
const uploadEmployeeDocument = createUploadMiddleware(5 * 1024 * 1024, 10 * 1024 * 1024).single('file');
const uploadSalarySlip = createUploadMiddleware(5 * 1024 * 1024, 10 * 1024 * 1024).single('file');

/**
 * Error handling middleware specifically for multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the allowed limit.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  uploadPurchaseBill,
  uploadEmployeeDocument,
  uploadSalarySlip,
  handleUploadError
};
