const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');
const { getPaginationParams } = require('../utils/pagination.utils');

const prisma = new PrismaClient();

const generatePurchaseCode = async () => {
  const count = await prisma.purchase.count();
  const date = new Date();
  return `PUR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
};

const calculateAmounts = (quantity, rate, gstPercent) => {
  const taxableAmount = parseFloat((quantity * rate).toFixed(2));
  const gstAmount = parseFloat((taxableAmount * gstPercent / 100).toFixed(2));
  const totalAmount = parseFloat((taxableAmount + gstAmount).toFixed(2));
  return { taxableAmount, gstAmount, totalAmount };
};

// GET /api/purchases
const getPurchases = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, materialType, paymentStatus, supplierId, startDate, endDate } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { purchaseCode: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (materialType) where.materialType = materialType;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { supplier: { select: { id: true, name: true, supplierCode: true } } },
      }),
      prisma.purchase.count({ where }),
    ]);

    return paginatedResponse(res, purchases, total, page, limit, 'Purchases fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch purchases', 500);
  }
};

// GET /api/purchases/:id
const getPurchase = async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        inventoryTransactions: { include: { inventory: true } },
      },
    });
    if (!purchase) return errorResponse(res, 'Purchase not found', 404);
    return successResponse(res, purchase, 'Purchase fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch purchase', 500);
  }
};

// POST /api/purchases
const createPurchase = async (req, res) => {
  try {
    const {
      date, supplierId, invoiceNumber, materialType, quantity,
      unit, rate, gstPercent, transportDetails, paymentStatus, paidAmount, notes
    } = req.body;

    const purchaseCode = await generatePurchaseCode();
    const { taxableAmount, gstAmount, totalAmount } = calculateAmounts(
      parseFloat(quantity), parseFloat(rate), parseFloat(gstPercent || 0)
    );

    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseCode,
          date: new Date(date),
          supplierId,
          invoiceNumber,
          materialType,
          quantity: parseFloat(quantity),
          unit,
          rate: parseFloat(rate),
          gstPercent: parseFloat(gstPercent || 0),
          taxableAmount,
          gstAmount,
          totalAmount,
          transportDetails,
          paymentStatus: paymentStatus || 'PENDING',
          paidAmount: parseFloat(paidAmount || 0),
          notes,
        },
        include: { supplier: true },
      });

      // Auto-update inventory
      const categoryMap = {
        YARN: 'YARN', BEAM: 'BEAM', DYE_CHEMICAL: 'CHEMICALS',
        FABRIC: 'FABRIC', PACKING_MATERIAL: 'PACKING_MATERIALS',
        COTTON: 'YARN', POLYESTER: 'YARN',
      };
      const category = categoryMap[materialType] || 'YARN';

      let inventoryItem = await tx.inventory.findFirst({
        where: { materialName: materialType, category },
      });

      if (!inventoryItem) {
        inventoryItem = await tx.inventory.create({
          data: { materialName: materialType, category, unit, currentStock: 0, minStockLevel: 10 },
        });
      }

      await tx.inventory.update({
        where: { id: inventoryItem.id },
        data: { currentStock: { increment: parseFloat(quantity) } },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventoryItem.id,
          type: 'INWARD',
          quantity: parseFloat(quantity),
          date: new Date(date),
          purchaseId: newPurchase.id,
          reference: purchaseCode,
        },
      });

      return newPurchase;
    });

    return successResponse(res, purchase, 'Purchase created', 201);
  } catch (error) {
    console.error('Create purchase error:', error);
    return errorResponse(res, 'Failed to create purchase', 500);
  }
};

// PUT /api/purchases/:id
const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paidAmount, transportDetails, notes, isVerified } = req.body;

    const purchase = await prisma.purchase.update({
      where: { id },
      data: { paymentStatus, paidAmount: parseFloat(paidAmount || 0), transportDetails, notes, isVerified },
      include: { supplier: true },
    });
    return successResponse(res, purchase, 'Purchase updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update purchase', 500);
  }
};

// DELETE /api/purchases/:id
const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      // Reverse inventory
      const txns = await tx.inventoryTransaction.findMany({ where: { purchaseId: id } });
      for (const t of txns) {
        await tx.inventory.update({
          where: { id: t.inventoryId },
          data: { currentStock: { decrement: t.quantity } },
        });
      }
      await tx.inventoryTransaction.deleteMany({ where: { purchaseId: id } });
      await tx.purchase.delete({ where: { id } });
    });
    return successResponse(res, null, 'Purchase deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete purchase', 500);
  }
};

// POST /api/purchases/:id/bill — Upload bill
const uploadBill = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);

    const billUrl = `/uploads/purchases/${req.file.filename}`;
    const purchase = await prisma.purchase.update({
      where: { id },
      data: { billUrl, billFileId: req.file.filename },
    });
    return successResponse(res, { billUrl, purchase }, 'Bill uploaded');
  } catch (error) {
    return errorResponse(res, 'Failed to upload bill', 500);
  }
};

module.exports = { getPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase, uploadBill };
