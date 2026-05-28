import React, { useState, useEffect } from 'react';
import { Eye, Download, Trash2, X, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAPI } from '../../services/api';

const FileViewer = ({ fileId, fileName, fileUrl, onDelete, onFileDeleted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileBlob, setFileBlob] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isImage = fileName && (fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg'));
  const isPdf = fileName && fileName.toLowerCase().endsWith('.pdf');

  // Fetch the secure stream and create a blob URL
  const fetchFile = async () => {
    if (fileBlob) return; // Already fetched
    setIsLoading(true);
    try {
      const response = await uploadAPI.viewFile(fileId);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      setFileBlob(url);
    } catch (error) {
      console.error('Error fetching file:', error);
      toast.error('Failed to load the file. It may have been deleted or you lack permissions.');
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchFile();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDownload = async () => {
    if (!fileBlob) await fetchFile();
    if (fileBlob) {
      const link = document.createElement('a');
      link.href = fileBlob;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this file? This cannot be undone.')) {
      setIsDeleting(true);
      try {
        await uploadAPI.deleteFile(fileId);
        toast.success('File deleted successfully');
        if (onFileDeleted) onFileDeleted();
      } catch (error) {
        toast.error('Failed to delete file');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (fileBlob) {
        URL.revokeObjectURL(fileBlob);
      }
    };
  }, [fileBlob]);

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center space-x-3 overflow-hidden">
          <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate" title={fileName}>
            {fileName || 'Unknown File'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleOpen}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            title="View File"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            title="Download File"
          >
            <Download className="h-4 w-4" />
          </button>

          {onDelete !== false && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete File"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modal for viewing */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden m-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 truncate pr-4">{fileName}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </button>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500 p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="h-10 w-10 animate-spin mb-2" />
                  <p>Loading secure file...</p>
                </div>
              ) : fileBlob ? (
                isImage ? (
                  <img
                    src={fileBlob}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain shadow-sm"
                  />
                ) : isPdf ? (
                  <iframe
                    src={`${fileBlob}#toolbar=0`}
                    title={fileName}
                    className="w-full h-full shadow-sm rounded-md"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded shadow">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 mb-4">Preview not available for this file type.</p>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </button>
                  </div>
                )
              ) : (
                <div className="text-red-500">Failed to load file.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileViewer;
