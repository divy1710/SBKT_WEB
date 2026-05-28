const { google } = require('googleapis');
const stream = require('stream');

// Google Drive API setup
const setupDriveClient = () => {
  // Option 1: Use OAuth2 with a Refresh Token (Best for standard @gmail.com accounts)
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // Option 2: Use Service Account (Requires Google Workspace Shared Drive or Billing attached GCP Project)
  const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
};

const drive = setupDriveClient();
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID; // The 'Shree Brahmnikrupa Textile' folder

/**
 * Find a folder by name inside a parent folder
 */
const findFolder = async (folderName, parentId = ROOT_FOLDER_ID) => {
  try {
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding folder:', error);
    throw new Error('Failed to find Google Drive folder');
  }
};

/**
 * Create a folder by name inside a parent folder
 */
const createFolder = async (folderName, parentId = ROOT_FOLDER_ID) => {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
      supportsAllDrives: true,
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw new Error('Failed to create Google Drive folder');
  }
};

/**
 * Find or create a folder by name
 */
const findOrCreateFolder = async (folderName, parentId = ROOT_FOLDER_ID) => {
  const folderId = await findFolder(folderName, parentId);
  if (folderId) return folderId;
  return await createFolder(folderName, parentId);
};

/**
 * Upload a file to Google Drive
 * @param {Object} file - The file object from Multer (contains buffer, originalname, mimetype)
 * @param {String} folderName - The subfolder name (e.g., 'Purchases', 'Employee Documents')
 */
const uploadFile = async (file, folderName) => {
  try {
    // Ensure the target folder exists
    const folderId = await findOrCreateFolder(folderName);

    // Create a readable stream from the buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const fileMetadata = {
      name: `${Date.now()}_${file.originalname}`,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    return {
      fileId: response.data.id,
      fileName: response.data.name,
      // Since files are private, this URL requires user to be logged in to Google.
      // But we will stream it securely via backend anyway.
      fileUrl: response.data.webViewLink, 
    };
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
};

/**
 * Delete a file from Google Drive
 * @param {String} fileId - The Google Drive file ID
 */
const deleteFile = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId,
      supportsAllDrives: true,
    });
    return true;
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw new Error('Failed to delete file from Google Drive');
  }
};

/**
 * Get a secure file stream from Google Drive
 * @param {String} fileId - The Google Drive file ID
 */
const getSecureFileStream = async (fileId) => {
  try {
    // First, get the file metadata to know the mimetype and name
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType',
      supportsAllDrives: true,
    });

    // Then, get the file content as a stream
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    return {
      stream: response.data,
      metadata: fileMetadata.data,
    };
  } catch (error) {
    console.error('Error getting file stream from Google Drive:', error);
    throw new Error('Failed to fetch file from Google Drive');
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getSecureFileStream,
  findOrCreateFolder,
};
