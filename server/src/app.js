require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler } = require('./middleware/error.middleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const supplierRoutes = require('./routes/supplier.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const employeeRoutes = require('./routes/employee.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const salaryRoutes = require('./routes/salary.routes');
const advanceRoutes = require('./routes/advance.routes');
const reportsRoutes = require('./routes/reports.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.set('trust proxy', 1); // Trust first proxy (Render, Vercel, Heroku, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
console.log("CLIENT_URL:", process.env.CLIENT_URL);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts, please try again later.',
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Static Files ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/uploads', uploadRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: 'Shree Brahmnikrupa Textile ERP',
    version: '1.0.0',
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║  Shree Brahmnikrupa Textile ERP - Backend      ║
  ║  Server running on http://localhost:${PORT}       ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}                ║
  ╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
