import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from 'react-query';
import axios from 'axios';
import { FaCloudUploadAlt, FaTimes, FaCheck, FaFile, FaImage, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const FileUpload = ({ 
  type = 'image', 
  multiple = false, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadSuccess, 
  onUploadError,
  className = '' 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation(
    (file) => {
      const formData = new FormData();
      const fieldName = type === 'image' ? 'image' : 
                       type === 'avatar' ? 'avatar' : 
                       type === 'gig-images' ? 'images' : 'document';
      
      if (type === 'gig-images') {
        file.forEach(f => formData.append('images', f));
      } else {
        formData.append(fieldName, file);
      }
      
      const endpoint = `/api/upload/${type === 'gig-images' ? 'gig-images' : type}`;
      return axios.post(endpoint, formData);
    },
    {
      onSuccess: (data) => {
        const uploadedData = data.data.data;
        const newFiles = Array.isArray(uploadedData) ? uploadedData : [uploadedData];
        
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setUploading(false);
        
        if (onUploadSuccess) {
          onUploadSuccess(newFiles);
        }
        
        toast.success(`${newFiles.length} file(s) uploaded successfully!`);
      },
      onError: (error) => {
        setUploading(false);
        const message = error.response?.data?.message || 'Upload failed';
        toast.error(message);
        
        if (onUploadError) {
          onUploadError(error);
        }
      }
    }
  );

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name} has an invalid file type`);
          } else {
            toast.error(`${file.name}: ${error.message}`);
          }
        });
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      setUploading(true);
      uploadMutation.mutate(multiple ? acceptedFiles : acceptedFiles[0]);
    }
  }, [multiple, maxSize, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: type === 'image' || type === 'avatar' ? {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    } : type === 'gig-images' ? {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    } : {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    multiple,
    maxFiles,
    maxSize
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.publicId !== fileId));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <FaImage className="w-4 h-4" />;
    }
    return <FaFile className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FaCloudUploadAlt className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : `Drag & drop ${type === 'image' ? 'images' : 'files'} here, or click to select`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} file(s), {maxSize / (1024 * 1024)}MB each
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.publicId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {file.format && file.format.startsWith('image') ? (
                    <img
                      src={file.url}
                      alt={file.fileName || 'Uploaded image'}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(file.format || 'application/octet-stream')}
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.fileName || 'Uploaded file'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.size && formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FaCheck className="w-4 h-4 text-green-500" />
                  <button
                    onClick={() => removeFile(file.publicId)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Remove file"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadMutation.isError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Upload failed. Please try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 