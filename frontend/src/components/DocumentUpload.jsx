import React, { useRef, useState } from 'react';
import './DocumentUpload.css';

const DocumentUpload = ({ onDocumentExtracted, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, JPG, JPEG, or PNG files.';
    }
    if (file.size > maxFileSize) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      await onDocumentExtracted(file);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to process document. Please try again.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="document-upload-container">
      <div className="document-upload-header">
        <h3>📄 Upload Land Document (Optional)</h3>
        <p className="document-upload-subtitle">
          Auto-fill form fields by uploading your land ownership document
        </p>
      </div>

      <div
        className={`document-drop-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {isProcessing ? (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p className="processing-text">Analyzing your document...</p>
            <p className="processing-subtext">Extracting information from Nepali and English text</p>
          </div>
        ) : selectedFile ? (
          <div className="file-selected" onClick={(e) => e.stopPropagation()}>
            <div className="file-info">
              <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="file-details">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              type="button"
              className="clear-file-btn"
              onClick={clearFile}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="drop-zone-content">
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="drop-zone-text">
              Drag & drop your land document here
            </p>
            <p className="drop-zone-subtext">or</p>
            <button type="button" className="browse-btn" disabled={disabled}>
              Browse Files
            </button>
            <p className="file-requirements">
              Supported formats: PDF, JPG, JPEG, PNG (Max 10MB)
            </p>
            <p className="language-support">
              🌐 Supports both Nepali (नेपाली) and English documents
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="document-upload-error">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      <div className="document-info-box">
        <p className="info-title">ℹ️ How it works:</p>
        <ul className="info-list">
          <li>Upload your land ownership certificate or related document</li>
          <li>Our system will automatically extract key information</li>
          <li>Review and complete any missing fields</li>
          <li>Submit your land listing</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload;
