# Shree Brahmnikrupa Textile ERP

A complete, production-ready Textile ERP + HR + Payroll + Inventory Management System.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | TanStack React Query |
| Forms | React Hook Form |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| File Upload | Multer (local) → Google Drive API (Phase 12) |
| PDF Export | html2pdf.js |
| Excel Export | xlsx |

---

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)
- npm 9+

---

## Quick Start

### 1. Configure Database

Edit `server/.env` and set your PostgreSQL URL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/sbkt_erp"
JWT_SECRET="your-secret-key-here"
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Setup Database

```bash
# Push schema to database
npm run db:push

# Seed with sample data and admin user
npm run db:seed
```

### 4. Start Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sbkt.com | Admin@123 |
| Purchase Manager | purchase@sbkt.com | Password@123 |
| HR Manager | hr@sbkt.com | Password@123 |
| Accountant | accounts@sbkt.com | Password@123 |
| Store Manager | store@sbkt.com | Password@123 |

---

## Project Structure

```
SBKT_WEB/
├── server/                     # Node.js + Express Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (12 models)
│   │   └── seed.js             # Sample data seeder
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── supplier.controller.js
│   │   │   ├── purchase.controller.js
│   │   │   ├── inventory.controller.js
│   │   │   ├── employee.controller.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── salary.controller.js
│   │   │   ├── advance.controller.js
│   │   │   ├── reports.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── routes/             # Express routes
│   │   ├── middleware/         # Auth, roles, upload, error handling
│   │   ├── utils/              # JWT, pagination, response helpers
│   │   └── app.js              # Main Express app
│   ├── uploads/                # File upload storage
│   └── .env                    # Environment variables
│
└── client/                     # React Frontend
    ├── src/
    │   ├── pages/
    │   │   ├── auth/           # Login, Users
    │   │   ├── dashboard/      # Dashboard with charts
    │   │   ├── purchases/      # Purchase management
    │   │   ├── suppliers/      # Supplier management
    │   │   ├── inventory/      # Inventory tracking
    │   │   ├── employees/      # Employee management
    │   │   ├── attendance/     # Attendance marking
    │   │   ├── salary/         # Payroll + salary slips
    │   │   ├── advances/       # Advance salary
    │   │   └── reports/        # All reports + Excel export
    │   ├── components/
    │   │   └── layout/         # Sidebar, Navbar, Layout
    │   ├── context/            # AuthContext
    │   ├── routes/             # AppRouter + ProtectedRoute
    │   ├── services/           # API service layer (Axios)
    │   └── index.css           # Global styles
    └── .env                    # VITE_API_URL
```

---

## Features

### ✅ Authentication & Security
- JWT-based authentication with 7-day tokens
- bcrypt password hashing (12 rounds)
- Role-based access control (5 roles)
- Rate limiting (500 req/15min general, 20 login attempts)
- Helmet security headers
- CORS protection

### ✅ Dashboard
- Real-time stat cards (purchases, inventory, HR, salary)
- Monthly purchase trend (Area chart)
- Today's attendance breakdown (Pie chart)
- Inventory stock levels (Bar chart)
- Low stock alert banner

### ✅ Purchase Management
- Full CRUD with live amount calculation
- GST calculation (0%, 5%, 12%, 18%, 28%)
- Bill upload (PDF/JPG/PNG, max 10MB)
- Payment status tracking (Pending/Partial/Paid)
- Search & filters by material, supplier, payment status

### ✅ Supplier Management
- Full CRUD with purchase history count
- GST number, payment terms
- Soft delete protection (can't delete with purchases)

### ✅ Inventory Management
- Auto-update on purchase creation
- Card view with stock bar indicators
- Low stock alerts with configurable min/max levels
- Manual outward entries
- Per-item transaction history

### ✅ Employee Management
- Card grid with photos
- 8 employee roles
- 4 salary types (Monthly/Daily/Piece/Overtime)
- Photo upload

### ✅ Attendance Management
- Daily bulk marking with click-to-cycle status buttons
- 5 statuses: Present / Absent / Half Day / Leave / Overtime
- Overtime hours tracking
- Monthly summary view

### ✅ Salary & Payroll
- Automatic payroll generation for all employees
- 4 calculation methods based on salary type
- Overtime auto-calculation (1.5x rate)
- Advance auto-deduction from salary
- Beautiful printable salary slip
- PDF export via html2pdf.js
- Approve → Pay workflow

### ✅ Advance Salary
- Track advances with deduction status
- Auto-marks deducted after payroll generation
- Per-employee advance history

### ✅ Reports & Export
- Purchase reports (daily/monthly/yearly ranges)
- Attendance reports (monthly)
- Salary reports (with summary)
- Inventory reports (with month inward/outward)
- Excel export for all reports (xlsx)
- Filter by date, category, status

---

## API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/change-password
GET    /api/auth/users             (Admin)
POST   /api/auth/users             (Admin)
PUT    /api/auth/users/:id         (Admin)

GET    /api/dashboard/stats

GET    /api/suppliers
GET    /api/suppliers/list
GET    /api/suppliers/:id
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id

GET    /api/purchases
GET    /api/purchases/:id
POST   /api/purchases
PUT    /api/purchases/:id
DELETE /api/purchases/:id
POST   /api/purchases/:id/bill

GET    /api/inventory
GET    /api/inventory/low-stock
GET    /api/inventory/:id
GET    /api/inventory/:id/transactions
POST   /api/inventory/outward
PUT    /api/inventory/:id

GET    /api/employees
GET    /api/employees/list
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

GET    /api/attendance
GET    /api/attendance/daily
GET    /api/attendance/monthly-summary
POST   /api/attendance
PUT    /api/attendance/:id

GET    /api/salary
GET    /api/salary/:id
POST   /api/salary/generate
PUT    /api/salary/:id/approve
PUT    /api/salary/:id/pay

GET    /api/advances
POST   /api/advances
PUT    /api/advances/:id
DELETE /api/advances/:id

GET    /api/reports/purchases
GET    /api/reports/attendance
GET    /api/reports/salary
GET    /api/reports/inventory
```

---

## Environment Variables

### Server (`server/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sbkt_erp"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"

# Google Drive (Phase 12)
GOOGLE_DRIVE_ENABLED=false
GOOGLE_CLIENT_EMAIL=""
GOOGLE_PRIVATE_KEY=""
GOOGLE_DRIVE_ROOT_FOLDER_ID=""
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Database Commands

```bash
npm run db:push      # Apply schema without migration history
npm run db:migrate   # Run migrations (production)
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio (visual DB editor)
npm run db:generate  # Regenerate Prisma client
```

---

## Upcoming (Phase 12-13)

- [ ] Google Drive API integration for bill/document storage
- [ ] Audit trail (action logs)
- [ ] Notification system
- [ ] Rate limiting tuning
- [ ] Production deployment setup
- [ ] Biometric attendance integration
- [ ] GST billing module
- [ ] Production/Loom tracking
