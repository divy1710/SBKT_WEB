const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');
const { getPaginationParams } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

// GET /api/inventory
const getInventory = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { category, search, lowStock } = req.query;

    const where = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [{ materialName: { contains: search, mode: 'insensitive' } }];
    }
    if (lowStock === 'true') {
      where.AND = [{ currentStock: { lte: prisma.inventory.fields.minStockLevel } }];
    }

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { materialName: 'asc' },
        include: {
          _count: { select: { transactions: true } },
        },
      }),
      prisma.inventory.count({ where }),
    ]);

    // Flag low stock
    const withAlerts = items.map(item => ({
      ...item,
      isLowStock: item.currentStock <= item.minStockLevel,
    }));

    return paginatedResponse(res, withAlerts, total, page, limit, 'Inventory fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch inventory', 500);
  }
};

// GET /api/inventory/low-stock
const getLowStock = async (req, res) => {
  try {
    const items = await prisma.inventory.findMany({
      where: {
        isActive: true,
        currentStock: { lte: 10 }, // simplified check
      },
    });
    // Filter by minStockLevel in memory
    const lowStockItems = items.filter(i => i.currentStock <= i.minStockLevel);
    return successResponse(res, lowStockItems, 'Low stock items fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch low stock', 500);
  }
};

// GET /api/inventory/:id
const getInventoryItem = async (req, res) => {
  try {
    const item = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 20,
          include: { purchase: { select: { purchaseCode: true, invoiceNumber: true } } },
        },
      },
    });
    if (!item) return errorResponse(res, 'Inventory item not found', 404);
    return successResponse(res, item, 'Inventory item fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch inventory item', 500);
  }
};

// POST /api/inventory — Manual outward
const createOutward = async (req, res) => {
  try {
    const { inventoryId, quantity, notes, date } = req.body;

    const item = await prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!item) return errorResponse(res, 'Inventory item not found', 404);
    if (item.currentStock < parseFloat(quantity)) {
      return errorResponse(res, 'Insufficient stock', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const txn = await tx.inventoryTransaction.create({
        data: {
          inventoryId,
          type: 'OUTWARD',
          quantity: parseFloat(quantity),
          date: date ? new Date(date) : new Date(),
          notes,
          reference: 'MANUAL-OUTWARD',
        },
      });
      await tx.inventory.update({
        where: { id: inventoryId },
        data: { currentStock: { decrement: parseFloat(quantity) } },
      });
      return txn;
    });

    return successResponse(res, result, 'Outward entry created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create outward entry', 500);
  }
};

// PUT /api/inventory/:id
const updateInventoryItem = async (req, res) => {
  try {
    const { minStockLevel, maxStockLevel, isActive } = req.body;
    const item = await prisma.inventory.update({
      where: { id: req.params.id },
      data: {
        minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : undefined,
        maxStockLevel: maxStockLevel !== undefined ? parseFloat(maxStockLevel) : undefined,
        isActive,
      },
    });
    return successResponse(res, item, 'Inventory item updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update inventory item', 500);
  }
};

// GET /api/inventory/:id/transactions
const getTransactions = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where: { inventoryId: req.params.id },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { purchase: { select: { purchaseCode: true, invoiceNumber: true } } },
      }),
      prisma.inventoryTransaction.count({ where: { inventoryId: req.params.id } }),
    ]);
    return paginatedResponse(res, transactions, total, page, limit);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch transactions', 500);
  }
};

module.exports = { getInventory, getLowStock, getInventoryItem, createOutward, updateInventoryItem, getTransactions };
