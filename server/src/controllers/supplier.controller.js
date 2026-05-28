const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');
const { getPaginationParams } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const generateSupplierCode = async () => {
  const count = await prisma.supplier.count();
  return `SUP-${String(count + 1).padStart(4, '0')}`;
};

// GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, isActive } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { supplierCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { purchases: true } },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return paginatedResponse(res, suppliers, total, page, limit, 'Suppliers fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch suppliers', 500);
  }
};

// GET /api/suppliers/:id
const getSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { date: 'desc' },
          take: 10,
          include: { supplier: { select: { name: true } } },
        },
        _count: { select: { purchases: true } },
      },
    });
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);
    return successResponse(res, supplier, 'Supplier fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch supplier', 500);
  }
};

// POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const { name, gstNumber, phone, email, address, paymentTerms } = req.body;
    const supplierCode = await generateSupplierCode();

    const supplier = await prisma.supplier.create({
      data: { supplierCode, name, gstNumber, phone, email, address, paymentTerms },
    });
    return successResponse(res, supplier, 'Supplier created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create supplier', 500);
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gstNumber, phone, email, address, paymentTerms, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, gstNumber, phone, email, address, paymentTerms, isActive },
    });
    return successResponse(res, supplier, 'Supplier updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update supplier', 500);
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await prisma.purchase.count({ where: { supplierId: id } });
    if (count > 0) {
      return errorResponse(res, 'Cannot delete supplier with existing purchases. Deactivate instead.', 400);
    }
    await prisma.supplier.delete({ where: { id } });
    return successResponse(res, null, 'Supplier deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete supplier', 500);
  }
};

// GET /api/suppliers/list — lightweight for dropdowns
const getSuppliersList = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true, supplierCode: true, gstNumber: true, phone: true },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, suppliers, 'Suppliers list fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch suppliers list', 500);
  }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getSuppliersList };
