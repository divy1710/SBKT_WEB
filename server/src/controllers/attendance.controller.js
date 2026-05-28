const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');
const { getPaginationParams } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

// GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { employeeId, date, month, year, status } = req.query;

    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      where.date = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    } else if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { employee: { fullName: 'asc' } }],
        include: {
          employee: { select: { id: true, employeeCode: true, fullName: true, role: true, shift: true } },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return paginatedResponse(res, records, total, page, limit, 'Attendance fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch attendance', 500);
  }
};

// GET /api/attendance/daily?date=
const getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const [employees, attendance] = await Promise.all([
      prisma.employee.findMany({
        where: { status: true },
        select: { id: true, employeeCode: true, fullName: true, role: true, shift: true },
        orderBy: { fullName: 'asc' },
      }),
      prisma.attendance.findMany({
        where: { date: { gte: startOfDay, lt: endOfDay } },
        include: { employee: { select: { id: true, fullName: true } } },
      }),
    ]);

    const attendanceMap = {};
    attendance.forEach(a => { attendanceMap[a.employeeId] = a; });

    const result = employees.map(emp => ({
      employee: emp,
      attendance: attendanceMap[emp.id] || null,
    }));

    return successResponse(res, result, 'Daily attendance fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch daily attendance', 500);
  }
};

// POST /api/attendance — Single or bulk
const markAttendance = async (req, res) => {
  try {
    const { records } = req.body; // Array of { employeeId, date, shift, status, overtimeHours }

    const results = await prisma.$transaction(
      records.map(r =>
        prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: r.employeeId, date: new Date(r.date) } },
          update: {
            shift: r.shift,
            status: r.status,
            overtimeHours: parseFloat(r.overtimeHours || 0),
            notes: r.notes,
          },
          create: {
            employeeId: r.employeeId,
            date: new Date(r.date),
            shift: r.shift || 'MORNING',
            status: r.status || 'PRESENT',
            overtimeHours: parseFloat(r.overtimeHours || 0),
            notes: r.notes,
          },
        })
      )
    );

    return successResponse(res, results, 'Attendance marked', 201);
  } catch (error) {
    console.error('Mark attendance error:', error);
    return errorResponse(res, 'Failed to mark attendance', 500);
  }
};

// GET /api/attendance/monthly-summary?month=&year=&employeeId=
const getMonthlySummary = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    if (!month || !year) return errorResponse(res, 'Month and year required', 400);

    const m = parseInt(month);
    const y = parseInt(year);

    const where = {
      date: {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      },
    };
    if (employeeId) where.employeeId = employeeId;

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true, role: true, salaryType: true, basicSalary: true } },
      },
    });

    // Group by employee
    const summaryMap = {};
    attendance.forEach(a => {
      const eid = a.employeeId;
      if (!summaryMap[eid]) {
        summaryMap[eid] = {
          employee: a.employee,
          present: 0, absent: 0, halfDay: 0, leave: 0, overtime: 0, overtimeHours: 0,
        };
      }
      const s = summaryMap[eid];
      if (a.status === 'PRESENT' || a.status === 'OVERTIME') s.present++;
      if (a.status === 'ABSENT') s.absent++;
      if (a.status === 'HALF_DAY') s.halfDay++;
      if (a.status === 'LEAVE') s.leave++;
      if (a.status === 'OVERTIME') s.overtime++;
      s.overtimeHours += a.overtimeHours;
    });

    return successResponse(res, Object.values(summaryMap), 'Monthly summary fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch monthly summary', 500);
  }
};

// PUT /api/attendance/:id
const updateAttendance = async (req, res) => {
  try {
    const { shift, status, overtimeHours, notes } = req.body;
    const record = await prisma.attendance.update({
      where: { id: req.params.id },
      data: { shift, status, overtimeHours: parseFloat(overtimeHours || 0), notes },
    });
    return successResponse(res, record, 'Attendance updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update attendance', 500);
  }
};

module.exports = { getAttendance, getDailyAttendance, markAttendance, getMonthlySummary, updateAttendance };
