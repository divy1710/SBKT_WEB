import React, { useState } from 'react';
import FileUpload from '../components/common/FileUpload';
import FileViewer from '../components/common/FileViewer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const UploadDemo = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Mock ID since we don't have a real purchase ID in this demo page.
  // In a real scenario, this would be an actual purchase or employee ID from the database.
  const MOCK_PURCHASE_ID = '00000000-0000-0000-0000-000000000000'; 
  const MOCK_EMPLOYEE_ID = '11111111-1111-1111-1111-111111111111';

  const handleUploadSuccess = (data) => {
    // Add the newly uploaded file to our state so we can view it
    setUploadedFiles(prev => [...prev, data.file]);
  };

  const handleFileDeleted = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.fileId !== fileId));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Drive Upload Integration</h1>
        <p className="text-gray-500 mt-1">
          Demo page showing how to use the FileUpload and FileViewer components.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Bill Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Uploads a bill and links it to a Purchase record.
            </p>
            <FileUpload 
              type="purchase" 
              relatedId={MOCK_PURCHASE_ID} 
              onUploadSuccess={handleUploadSuccess} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Document Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Uploads a document (e.g., Aadhar, Photo) and links it to an Employee.
            </p>
            <FileUpload 
              type="employee_document" 
              relatedId={MOCK_EMPLOYEE_ID} 
              documentTitle="Aadhar Card"
              onUploadSuccess={handleUploadSuccess} 
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No files uploaded yet in this session.
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <FileViewer 
                  key={file.fileId} 
                  fileId={file.fileId} 
                  fileName={file.fileName}
                  fileUrl={file.fileUrl} // Note: This URL might require Google Login, we use our backend stream instead.
                  onFileDeleted={() => handleFileDeleted(file.fileId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadDemo;
