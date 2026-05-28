const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const { successResponse, errorResponse } = require('../utils/response.utils');

const prisma = new PrismaClient();

// GET /api/reports/purchases
const getPurchaseReport = async (req, res) => {
  try {
    const { startDate, endDate, materialType, supplierId, paymentStatus, format } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (materialType) where.materialType = materialType;
    if (supplierId) where.supplierId = supplierId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const purchases = await prisma.purchase.findMany({
      where,
      include: { supplier: { select: { name: true, gstNumber: true } } },
      orderBy: { date: 'desc' },
    });

    const summary = {
      total: purchases.length,
      totalAmount: purchases.reduce((s, p) => s + p.totalAmount, 0),
      totalGST: purchases.reduce((s, p) => s + p.gstAmount, 0),
      paid: purchases.filter(p => p.paymentStatus === 'PAID').length,
      pending: purchases.filter(p => p.paymentStatus === 'PENDING').length,
      pendingAmount: purchases.filter(p => p.paymentStatus !== 'PAID').reduce((s, p) => s + (p.totalAmount - p.paidAmount), 0),
    };

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(purchases.map(p => ({
        'Purchase Code': p.purchaseCode,
        'Date': new Date(p.date).toLocaleDateString('en-IN'),
        'Supplier': p.supplier.name,
        'Invoice No': p.invoiceNumber,
        'Material': p.materialType,
        'Quantity': p.quantity,
        'Unit': p.unit,
        'Rate': p.rate,
        'GST%': p.gstPercent,
        'Taxable Amt': p.taxableAmount,
        'GST Amt': p.gstAmount,
        'Total Amt': p.totalAmount,
        'Payment Status': p.paymentStatus,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=purchase-report.xlsx');
      return res.send(buffer);
    }

    return successResponse(res, { purchases, summary }, 'Purchase report generated');
  } catch (error) {
    return errorResponse(res, 'Failed to generate purchase report', 500);
  }
};

// GET /api/reports/attendance
const getAttendanceReport = async (req, res) => {
  try {
    const { month, year, employeeId, format } = req.query;
    if (!month || !year) return errorResponse(res, 'Month and year required', 400);

    const m = parseInt(month);
    const y = parseInt(year);
    const where = {
      date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) },
    };
    if (employeeId) where.employeeId = employeeId;

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: { select: { employeeCode: true, fullName: true, role: true } },
      },
      orderBy: [{ employee: { fullName: 'asc' } }, { date: 'asc' }],
    });

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(attendance.map(a => ({
        'Employee Code': a.employee.employeeCode,
        'Employee Name': a.employee.fullName,
        'Role': a.employee.role,
        'Date': new Date(a.date).toLocaleDateString('en-IN'),
        'Shift': a.shift,
        'Status': a.status,
        'Overtime Hours': a.overtimeHours,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
      return res.send(buffer);
    }

    return successResponse(res, attendance, 'Attendance report generated');
  } catch (error) {
    return errorResponse(res, 'Failed to generate attendance report', 500);
  }
};

// GET /api/reports/salary
const getSalaryReport = async (req, res) => {
  try {
    const { month, year, status, format } = req.query;

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        employee: { select: { employeeCode: true, fullName: true, role: true, salaryType: true } },
      },
      orderBy: { employee: { fullName: 'asc' } },
    });

    const summary = {
      total: salaries.length,
      totalGross: salaries.reduce((s, sal) => s + sal.grossSalary, 0),
      totalFinal: salaries.reduce((s, sal) => s + sal.finalSalary, 0),
      totalBonus: salaries.reduce((s, sal) => s + sal.bonus, 0),
      totalDeductions: salaries.reduce((s, sal) => s + sal.deductions + sal.advanceDeducted, 0),
      paid: salaries.filter(s => s.status === 'PAID').length,
      pending: salaries.filter(s => s.status !== 'PAID').length,
    };

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(salaries.map(s => ({
        'Employee Code': s.employee.employeeCode,
        'Employee Name': s.employee.fullName,
        'Role': s.employee.role,
        'Month/Year': `${s.month}/${s.year}`,
        'Present Days': s.presentDays,
        'Absent Days': s.absentDays,
        'Overtime Hrs': s.overtimeHours,
        'Gross Salary': s.grossSalary,
        'Bonus': s.bonus,
        'Deductions': s.deductions,
        'Advance Deducted': s.advanceDeducted,
        'Final Salary': s.finalSalary,
        'Status': s.status,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Salaries');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=salary-report.xlsx');
      return res.send(buffer);
    }

    return successResponse(res, { salaries, summary }, 'Salary report generated');
  } catch (error) {
    return errorResponse(res, 'Failed to generate salary report', 500);
  }
};

// GET /api/reports/inventory
const getInventoryReport = async (req, res) => {
  try {
    const { category, format } = req.query;

    const where = { isActive: true };
    if (category) where.category = category;

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        transactions: {
          where: { date: { gte: new Date(new Date().setDate(1)) } },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { category: 'asc' },
    });

    const withStats = inventory.map(item => {
      const inward = item.transactions.filter(t => t.type === 'INWARD').reduce((s, t) => s + t.quantity, 0);
      const outward = item.transactions.filter(t => t.type === 'OUTWARD').reduce((s, t) => s + t.quantity, 0);
      return {
        ...item,
        monthInward: inward,
        monthOutward: outward,
        isLowStock: item.currentStock <= item.minStockLevel,
      };
    });

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(withStats.map(i => ({
        'Material Name': i.materialName,
        'Category': i.category,
        'Current Stock': i.currentStock,
        'Unit': i.unit,
        'Min Stock Level': i.minStockLevel,
        'Month Inward': i.monthInward,
        'Month Outward': i.monthOutward,
        'Low Stock': i.isLowStock ? 'YES' : 'NO',
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');
      return res.send(buffer);
    }

    return successResponse(res, withStats, 'Inventory report generated');
  } catch (error) {
    return errorResponse(res, 'Failed to generate inventory report', 500);
  }
};

module.exports = { getPurchaseReport, getAttendanceReport, getSalaryReport, getInventoryReport };
