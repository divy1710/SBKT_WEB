const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');
const { getPaginationParams } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const generateEmployeeCode = async () => {
  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const { search, role, status, shift } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (status !== undefined && status !== '') {
      where.status = status === 'true';
    }
    if (shift) where.shift = shift;

    const employees = await prisma.employee.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Debug logs
    console.log('Fetched employees:', employees);

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return errorResponse(res, 'Failed to fetch employees', 500);
  }
};


// GET /api/employees/list — lightweight for dropdowns
const getEmployeesList = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { status: true },
      select: { id: true, employeeCode: true, fullName: true, role: true, shift: true },
      orderBy: { fullName: 'asc' },
    });
    return successResponse(res, employees, 'Employees list fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch employees', 500);
  }
};

// GET /api/employees/:id
const getEmployee = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        salaries: { orderBy: { year: 'desc' }, take: 12 },
        advances: { orderBy: { date: 'desc' }, take: 10 },
        leaves: { orderBy: { startDate: 'desc' }, take: 10 },
      },
    });
    if (!employee) return errorResponse(res, 'Employee not found', 404);
    return successResponse(res, employee, 'Employee fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch employee', 500);
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const {
      fullName, mobile, address, aadharNumber, role, joiningDate,
      salaryType, basicSalary, shift,
    } = req.body;
    const employeeCode = await generateEmployeeCode();
    const photoUrl = req.file ? `/uploads/employees/${req.file.filename}` : null;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        fullName,
        mobile,
        address,
        aadharNumber,
        role,
        joiningDate: new Date(joiningDate),
        salaryType,
        basicSalary: parseFloat(basicSalary),
        shift: shift || 'MORNING',
        photoUrl,
        photoFileId: req.file?.filename || null,
      },
    });
    return successResponse(res, employee, 'Employee created', 201);
  } catch (error) {
    console.error('Create employee error:', error);
    return errorResponse(res, 'Failed to create employee', 500);
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName, mobile, address, role, salaryType,
      basicSalary, shift, status,
    } = req.body;

    const data = {
      fullName, mobile, address, role, salaryType,
      basicSalary: basicSalary ? parseFloat(basicSalary) : undefined,
      shift, status: status !== undefined ? status === 'true' || status === true : undefined,
    };

    if (req.file) {
      data.photoUrl = `/uploads/employees/${req.file.filename}`;
      data.photoFileId = req.file.filename;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
    });
    return successResponse(res, employee, 'Employee updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update employee', 500);
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Use a transaction to safely perform a cascade delete
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { employeeId: id } }),
      prisma.salary.deleteMany({ where: { employeeId: id } }),
      prisma.salaryAdvance.deleteMany({ where: { employeeId: id } }),
      prisma.leave.deleteMany({ where: { employeeId: id } }),
      prisma.employee.delete({ where: { id } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Employee permanently deleted successfully',
    });
  } catch (error) {
    console.error('Delete Employee Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee permanently',
      error: error.message,
    });
  }
};

module.exports = { getEmployees, getEmployeesList, getEmployee, createEmployee, updateEmployee, deleteEmployee };
