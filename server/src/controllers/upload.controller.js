const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const googleDriveService = require('../services/googleDrive.service');

/**
 * Handle upload of a purchase bill
 */
const uploadPurchaseBill = async (req, res) => {
  try {
    const { purchaseId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (!purchaseId) {
      return res.status(400).json({ error: 'Purchase ID is required.' });
    }

    // Check if purchase exists
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId }
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }

    // Upload to Google Drive
    // If you want more specific folders based on material type, you can determine that here
    const folderName = purchase.materialType === 'YARN' ? 'Yarn Bills' :
                       purchase.materialType === 'BEAM' ? 'Beam Bills' : 'Purchase Bills';
                       
    const driveFile = await googleDriveService.uploadFile(file, folderName);

    // Update Purchase record in database
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        billFileId: driveFile.fileId,
        billFileUrl: driveFile.fileUrl,
        billFileName: driveFile.fileName,
      }
    });

    res.status(200).json({
      message: 'Purchase bill uploaded successfully.',
      file: driveFile,
      purchase: updatedPurchase
    });
  } catch (error) {
    console.error('Upload Purchase Bill Error:', error);
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
};

/**
 * Handle upload of an employee document
 */
const uploadEmployeeDocument = async (req, res) => {
  try {
    const { employeeId, title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (!employeeId || !title) {
      return res.status(400).json({ error: 'Employee ID and Title are required.' });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Upload to Google Drive
    const driveFile = await googleDriveService.uploadFile(file, 'Employee Documents');

    // Create Employee Document record in database
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: employeeId,
        title: title,
        fileId: driveFile.fileId,
        fileUrl: driveFile.fileUrl,
        mimeType: file.mimetype,
      }
    });

    res.status(200).json({
      message: 'Employee document uploaded successfully.',
      file: driveFile,
      document: document
    });
  } catch (error) {
    console.error('Upload Employee Document Error:', error);
    res.status(500).json({ error: 'An error occurred while uploading the file.' });
  }
};

/**
 * Delete a file securely
 */
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // First, try to find the file in our database and clear references
    // 1. Check Purchases
    const purchase = await prisma.purchase.findFirst({
      where: { billFileId: fileId }
    });
    if (purchase) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { billFileId: null, billFileUrl: null, billFileName: null }
      });
    }

    // 2. Check Employee Documents
    const empDoc = await prisma.employeeDocument.findFirst({
      where: { fileId: fileId }
    });
    if (empDoc) {
      await prisma.employeeDocument.delete({
        where: { id: empDoc.id }
      });
    }

    // Delete from Google Drive
    await googleDriveService.deleteFile(fileId);

    res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Delete File Error:', error);
    res.status(500).json({ error: 'An error occurred while deleting the file.' });
  }
};

/**
 * View a file securely by piping the stream
 */
const viewFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const { stream, metadata } = await googleDriveService.getSecureFileStream(fileId);

    // Set appropriate headers
    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${metadata.name}"`);

    // Pipe the stream to the response
    stream.pipe(res);
  } catch (error) {
    console.error('View File Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching the file.' });
  }
};

module.exports = {
  uploadPurchaseBill,
  uploadEmployeeDocument,
  deleteFile,
  viewFile
};
