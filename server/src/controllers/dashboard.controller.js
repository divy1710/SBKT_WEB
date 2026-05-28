const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../utils/response.utils');

const prisma = new PrismaClient();

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalPurchases,
      todayPurchases,
      pendingBills,
      totalSuppliers,
      totalEmployees,
      inventoryItems,
      todayAttendance,
      monthSalary,
      pendingSalaries,
      lowStockItems,
      monthlyPurchaseData,
      monthlySalaryData,
    ] = await Promise.all([
      // Purchase stats
      prisma.purchase.aggregate({ _sum: { totalAmount: true }, _count: true }),
      prisma.purchase.aggregate({
        where: { date: { gte: startOfToday, lt: endOfToday } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.purchase.count({ where: { billFileUrl: null } }),
      prisma.supplier.count({ where: { isActive: true } }),

      // Employee stats
      prisma.employee.count({ where: { status: true } }),

      // Inventory
      prisma.inventory.findMany({
        where: { isActive: true },
        select: { materialName: true, currentStock: true, minStockLevel: true, unit: true, category: true },
      }),

      // Today attendance
      prisma.attendance.groupBy({
        by: ['status'],
        where: { date: { gte: startOfToday, lt: endOfToday } },
        _count: true,
      }),

      // Monthly salary expense
      prisma.salary.aggregate({
        where: {
          month: today.getMonth() + 1,
          year: today.getFullYear(),
        },
        _sum: { finalSalary: true },
      }),

      // Pending salary
      prisma.salary.count({ where: { status: { in: ['GENERATED', 'APPROVED'] } } }),

      // Low stock
      prisma.inventory.findMany({
        where: { isActive: true },
        select: { materialName: true, currentStock: true, minStockLevel: true, unit: true },
      }),

      // Monthly purchase data (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM("totalAmount") as total,
          CAST(COUNT(*) AS INTEGER) as count
        FROM purchases
        WHERE date >= ${new Date(today.getFullYear(), today.getMonth() - 5, 1)}
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month ASC
      `,

      // Monthly salary data (last 6 months)
      prisma.$queryRaw`
        SELECT 
          year, month,
          SUM("finalSalary") as total
        FROM salaries
        WHERE (year = ${today.getFullYear()} AND month >= ${today.getMonth() - 4})
           OR year > ${today.getFullYear()}
        GROUP BY year, month
        ORDER BY year, month ASC
      `,
    ]);

    // Attendance breakdown
    const attendanceStats = {
      present: 0, absent: 0, halfDay: 0, leave: 0, overtime: 0,
    };
    todayAttendance.forEach(({ status, _count }) => {
      if (status === 'PRESENT') attendanceStats.present = _count;
      if (status === 'ABSENT') attendanceStats.absent = _count;
      if (status === 'HALF_DAY') attendanceStats.halfDay = _count;
      if (status === 'LEAVE') attendanceStats.leave = _count;
      if (status === 'OVERTIME') attendanceStats.overtime = _count;
    });

    const lowStock = lowStockItems.filter(i => i.currentStock <= i.minStockLevel);

    const stats = {
      purchases: {
        total: totalPurchases._count,
        totalAmount: totalPurchases._sum.totalAmount || 0,
        todayCount: todayPurchases._count,
        todayAmount: todayPurchases._sum.totalAmount || 0,
        pendingBills,
        totalSuppliers,
      },
      inventory: {
        items: inventoryItems,
        lowStockCount: lowStock.length,
        lowStockItems: lowStock,
      },
      hr: {
        totalEmployees,
        ...attendanceStats,
      },
      salary: {
        monthlyExpense: monthSalary._sum.finalSalary || 0,
        pendingSalaries,
      },
      charts: {
        monthlyPurchases: monthlyPurchaseData,
        monthlySalaries: monthlySalaryData,
      },
    };

    return successResponse(res, stats, 'Dashboard stats fetched');
  } catch (error) {
    console.error('Dashboard error:', error);
    return errorResponse(res, 'Failed to fetch dashboard stats', 500);
  }
};

module.exports = { getDashboardStats };
