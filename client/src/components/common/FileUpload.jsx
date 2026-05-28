import React, { useState, useRef } from 'react';
import { Upload, X, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAPI } from '../../services/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const FileUpload = ({ 
  type = 'purchase', // 'purchase' or 'employee_document'
  relatedId, // purchaseId or employeeId
  documentTitle = '', // required if type === 'employee_document'
  onUploadSuccess 
}) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const validateFile = (fileToValidate) => {
    if (!ALLOWED_TYPES.includes(fileToValidate.type)) {
      toast.error('Invalid file type. Only PDF and Images (JPG/PNG) are allowed.');
      return false;
    }
    if (fileToValidate.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds the 10MB limit.');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!relatedId) {
      toast.error('Missing related record ID.');
      return;
    }

    if (type === 'employee_document' && !documentTitle) {
      toast.error('Document title is required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    if (type === 'purchase') {
      formData.append('purchaseId', relatedId);
    } else if (type === 'employee_document') {
      formData.append('employeeId', relatedId);
      formData.append('title', documentTitle);
    }

    setIsUploading(true);
    setUploadProgress(10); // Fake initial progress

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 500);

      let response;
      if (type === 'purchase') {
        response = await uploadAPI.uploadPurchaseBill(formData);
      } else {
        response = await uploadAPI.uploadEmployeeDocument(formData);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success(response.data.message || 'File uploaded successfully!');
      
      setTimeout(() => {
        clearFile();
        setIsUploading(false);
        if (onUploadSuccess) onUploadSuccess(response.data);
      }, 1000);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(error.response?.data?.error || 'Failed to upload file.');
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Upload a file</h3>
          <p className="text-sm text-gray-500 mb-4">Drag and drop or click to select</p>
          <p className="text-xs text-gray-400 mb-4">Supported: PDF, JPG, PNG (Max 10MB)</p>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Select File
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FileIcon className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {!isUploading && (
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-red-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {!isUploading && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleUpload}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Upload Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
