const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');
const { getPaginationParams } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

// Calculate salary based on employee's salary type and attendance
const calculateSalary = async (employee, attendanceSummary, overtimeRate = 0, bonus = 0, extraDeductions = 0, advances = 0) => {
  const { basicSalary, salaryType } = employee;
  const { present, halfDay, overtimeHours } = attendanceSummary;

  let grossSalary = 0;
  let overtimeAmount = 0;

  const workingDaysInMonth = 26; // standard

  switch (salaryType) {
    case 'MONTHLY':
      const effectiveDays = present + halfDay * 0.5;
      grossSalary = (basicSalary / workingDaysInMonth) * effectiveDays;
      break;
    case 'DAILY_WAGE':
      grossSalary = basicSalary * (present + halfDay * 0.5);
      break;
    case 'PIECE_RATE':
      // For piece rate, basicSalary represents rate per piece
      // This needs pieceCount which can be passed in
      grossSalary = basicSalary * (attendanceSummary.pieceCount || 0);
      break;
    case 'OVERTIME_BASED':
      grossSalary = basicSalary;
      break;
  }

  // Overtime calculation
  if (overtimeHours > 0 && overtimeRate > 0) {
    overtimeAmount = overtimeHours * overtimeRate;
  } else if (overtimeHours > 0) {
    // Default: hourly rate = monthly / (26 * 8)
    const hourlyRate = basicSalary / (workingDaysInMonth * 8);
    overtimeAmount = overtimeHours * hourlyRate * 1.5; // 1.5x for overtime
  }

  grossSalary = parseFloat(grossSalary.toFixed(2));
  overtimeAmount = parseFloat(overtimeAmount.toFixed(2));
  const deductions = parseFloat(extraDeductions.toFixed(2));
  const advanceDeducted = parseFloat(advances.toFixed(2));
  const bonusAmount = parseFloat(bonus.toFixed(2));

  const finalSalary = parseFloat(
    (grossSalary + overtimeAmount + bonusAmount - deductions - advanceDeducted).toFixed(2)
  );

  return { grossSalary, overtimeAmount, overtimeHours, bonusAmount, deductions, advanceDeducted, finalSalary };
};

// POST /api/salary/generate
const generatePayroll = async (req, res) => {
  try {
    const { month, year, employeeIds, overtimeRate, bonus, deductions } = req.body;
    const m = parseInt(month);
    const y = parseInt(year);

    const employees = employeeIds
      ? await prisma.employee.findMany({ where: { id: { in: employeeIds }, status: true } })
      : await prisma.employee.findMany({ where: { status: true } });

    const results = [];

    for (const emp of employees) {
      // Get attendance summary
      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) },
        },
      });

      const summary = {
        present: attendance.filter(a => a.status === 'PRESENT' || a.status === 'OVERTIME').length,
        absent: attendance.filter(a => a.status === 'ABSENT').length,
        halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
        leave: attendance.filter(a => a.status === 'LEAVE').length,
        overtimeHours: attendance.reduce((sum, a) => sum + a.overtimeHours, 0),
      };

      // Get pending advances
      const advances = await prisma.salaryAdvance.findMany({
        where: { employeeId: emp.id, isDeducted: false },
      });
      const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

      const empBonus = bonus?.[emp.id] || 0;
      const empDeductions = deductions?.[emp.id] || 0;
      const empOvertimeRate = overtimeRate || 0;

      const salaryCalc = await calculateSalary(emp, summary, empOvertimeRate, empBonus, empDeductions, totalAdvance);

      // Upsert salary record
      const salaryRecord = await prisma.salary.upsert({
        where: { employeeId_month_year: { employeeId: emp.id, month: m, year: y } },
        update: {
          presentDays: summary.present,
          absentDays: summary.absent,
          halfDays: summary.halfDay,
          overtimeHours: summary.overtimeHours,
          overtimeRate: empOvertimeRate,
          overtimeAmount: salaryCalc.overtimeAmount,
          bonus: salaryCalc.bonusAmount,
          deductions: salaryCalc.deductions,
          advanceDeducted: salaryCalc.advanceDeducted,
          grossSalary: salaryCalc.grossSalary,
          finalSalary: salaryCalc.finalSalary,
          status: 'GENERATED',
        },
        create: {
          employeeId: emp.id,
          month: m,
          year: y,
          presentDays: summary.present,
          absentDays: summary.absent,
          halfDays: summary.halfDay,
          overtimeHours: summary.overtimeHours,
          overtimeRate: empOvertimeRate,
          overtimeAmount: salaryCalc.overtimeAmount,
          bonus: salaryCalc.bonusAmount,
          deductions: salaryCalc.deductions,
          advanceDeducted: salaryCalc.advanceDeducted,
          grossSalary: salaryCalc.grossSalary,
          finalSalary: salaryCalc.finalSalary,
          status: 'GENERATED',
        },
        include: { employee: { select: { id: true, employeeCode: true, fullName: true, role: true } } },
      });

      // Mark advances as deducted
      if (totalAdvance > 0) {
        await prisma.salaryAdvance.updateMany({
          where: { employeeId: emp.id, isDeducted: false },
          data: { isDeducted: true, deductedIn: m, deductedYear: y },
        });
      }

      results.push(salaryRecord);
    }

    return successResponse(res, results, 'Payroll generated', 201);
  } catch (error) {
    console.error('Generate payroll error:', error);
    return errorResponse(res, 'Failed to generate payroll', 500);
  }
};

// GET /api/salary
const getSalaries = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { month, year, status, employeeId } = req.query;

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const [salaries, total] = await Promise.all([
      prisma.salary.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          employee: { select: { id: true, employeeCode: true, fullName: true, role: true, salaryType: true } },
        },
      }),
      prisma.salary.count({ where }),
    ]);

    return paginatedResponse(res, salaries, total, page, limit, 'Salaries fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch salaries', 500);
  }
};

// GET /api/salary/:id
const getSalary = async (req, res) => {
  try {
    const salary = await prisma.salary.findUnique({
      where: { id: req.params.id },
      include: {
        employee: true,
      },
    });
    if (!salary) return errorResponse(res, 'Salary record not found', 404);
    return successResponse(res, salary, 'Salary fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch salary', 500);
  }
};

// PUT /api/salary/:id/approve
const approveSalary = async (req, res) => {
  try {
    const salary = await prisma.salary.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
      include: { employee: { select: { fullName: true } } },
    });
    return successResponse(res, salary, 'Salary approved');
  } catch (error) {
    return errorResponse(res, 'Failed to approve salary', 500);
  }
};

// PUT /api/salary/:id/pay
const markSalaryPaid = async (req, res) => {
  try {
    const salary = await prisma.salary.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { employee: { select: { fullName: true } } },
    });
    return successResponse(res, salary, 'Salary marked as paid');
  } catch (error) {
    return errorResponse(res, 'Failed to mark salary paid', 500);
  }
};

module.exports = { generatePayroll, getSalaries, getSalary, approveSalary, markSalaryPaid };
