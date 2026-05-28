const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { errorResponse } = require('../utils/response.utils');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../../uploads');

    if (req.uploadCategory) {
      uploadPath = path.join(uploadPath, req.uploadCategory);
    }
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
  }
};

// Size limits
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE_PDF) || 10 * 1024 * 1024, // 10MB
};

const upload = multer({ storage, fileFilter, limits });

// Middleware factory
const uploadMiddleware = (fieldName, category) => {
  return [
    (req, res, next) => {
      req.uploadCategory = category || 'general';
      next();
    },
    (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return errorResponse(res, 'File size exceeds limit', 400);
          }
          return errorResponse(res, err.message, 400);
        }
        if (err) {
          return errorResponse(res, err.message, 400);
        }
        next();
      });
    },
  ];
};

module.exports = { uploadMiddleware };
