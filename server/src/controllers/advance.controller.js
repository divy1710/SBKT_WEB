const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');
const { getPaginationParams } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

// GET /api/advances
const getAdvances = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { employeeId, isDeducted } = req.query;

    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (isDeducted !== undefined) where.isDeducted = isDeducted === 'true';

    const [advances, total] = await Promise.all([
      prisma.salaryAdvance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          employee: { select: { id: true, employeeCode: true, fullName: true } },
        },
      }),
      prisma.salaryAdvance.count({ where }),
    ]);

    return paginatedResponse(res, advances, total, page, limit, 'Advances fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch advances', 500);
  }
};

// POST /api/advances
const createAdvance = async (req, res) => {
  try {
    const { employeeId, amount, date, reason } = req.body;
    const advance = await prisma.salaryAdvance.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        date: new Date(date),
        reason,
      },
      include: { employee: { select: { fullName: true, employeeCode: true } } },
    });
    return successResponse(res, advance, 'Advance created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create advance', 500);
  }
};

// PUT /api/advances/:id
const updateAdvance = async (req, res) => {
  try {
    const { amount, date, reason, isDeducted } = req.body;
    const advance = await prisma.salaryAdvance.update({
      where: { id: req.params.id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        reason,
        isDeducted,
      },
    });
    return successResponse(res, advance, 'Advance updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update advance', 500);
  }
};

// DELETE /api/advances/:id
const deleteAdvance = async (req, res) => {
  try {
    await prisma.salaryAdvance.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Advance deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete advance', 500);
  }
};

module.exports = { getAdvances, createAdvance, updateAdvance, deleteAdvance };
