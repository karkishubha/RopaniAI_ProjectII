import React, { useState } from 'react';
import './OCRForm.css';
import { FaUpload, FaFileAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Component for uploading and processing land documents using OCR
const OCRForm = () => {
  // State variables for managing file upload and OCR process
  const [file, setFile] = useState(null);                 // Selected file
  const [preview, setPreview] = useState(null);           // Image preview URL
  const [extractedData, setExtractedData] = useState(null); // OCR extracted data
  const [loading, setLoading] = useState(false);          // Loading state during extraction
  const [dragActive, setDragActive] = useState(false);    // Drag-and-drop active state

  // Handle file selection from file input
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // Process selected file and create image preview
  const processFile = (selectedFile) => {
    setFile(selectedFile);
    
    // Use FileReader to create a preview URL for the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle drag events for file drag-and-drop functionality
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);  // Show visual feedback when dragging over
    } else if (e.type === 'dragleave') {
      setDragActive(false); // Remove feedback when leaving
    }
  };

  // Handle file drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Process the dropped file
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Extract data from uploaded document (currently using mock data)
  // TODO: Replace with actual OCR API call to backend
  const handleExtractData = async () => {
    if (!file) return;

    setLoading(true);
    
    // Simulate API call with 2 second delay
    setTimeout(() => {
      // Mock extracted data - this will be replaced with real OCR results
      setExtractedData({
        documentType: 'Land Ownership Certificate',
        ownerName: 'Ram Prasad Sharma',
        plotNumber: '123-45-678',
        area: '5-2-3-1 (5 Ropani, 2 Aana, 3 Paisa, 1 Dam)',
        location: 'Kathmandu, Bagmati Pradesh',
        municipality: 'Kathmandu Metropolitan City',
        ward: '12',
        district: 'Kathmandu',
        registrationDate: '2078-05-15',
        registrationNumber: 'REG-2078-1234',
        landUse: 'Residential',
        boundaries: {
          east: 'Road (Sadak)',
          west: 'Hari Bahadur Land',
          north: 'Sita Devi Land',
          south: 'Community Land'
        }
      });
      setLoading(false);
    }, 2000);
  };

  // Reset form to initial state for new document upload
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
  };

  return (
    <div className="ocr-page">
      <div className="ocr-container">
        <div className="ocr-header">
          <h1>📄 Document OCR Scanner</h1>
          <p>Upload land documents to extract information automatically</p>
        </div>

        <div className="ocr-content">
          {/* File Upload Section - handles drag-and-drop and browse uploads */}
          <div className="upload-section">
            <h2>Upload Document</h2>
            
            <div 
              className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <FaUpload className="upload-icon" />
                  <p className="upload-text">Drag and drop your document here</p>
                  <p className="upload-subtext">or</p>
                  <label className="btn-browse">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <p className="upload-info">Supports: JPG, PNG, PDF (Max 10MB)</p>
                </>
              ) : (
                <div className="file-preview">
                  <FaFileAlt className="file-icon" />
                  <div className="file-details">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button className="btn-remove" onClick={handleReset}>
                    <FaTimesCircle />
                  </button>
                </div>
              )}
            </div>

            {/* Show extract button only when file is uploaded but data not yet extracted */}
            {file && !extractedData && (
              <button 
                className="btn-extract" 
                onClick={handleExtractData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Extracting Data...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Extract Information
                  </>
                )}
              </button>
            )}

            {/* Document Preview - shows uploaded image */}
            {preview && (
              <div className="image-preview">
                <h3>Document Preview</h3>
                <div className="preview-container">
                  <img src={preview} alt="Document preview" />
                </div>
              </div>
            )}
          </div>

          {/* Extracted Data Display - shows OCR results in organized format */}
          {extractedData && (
            <div className="extracted-section">
              <div className="extracted-header">
                <FaCheckCircle className="success-icon" />
                <div>
                  <h2>Extracted Information</h2>
                  <p>Data extracted successfully from your document</p>
                </div>
              </div>

              {/* Grid layout displaying extracted information in organized groups */}
              <div className="data-grid">
                <div className="data-group">
                  <h3>Document Details</h3>
                  <div className="data-item">
                    <label>Document Type:</label>
                    <span>{extractedData.documentType}</span>
                  </div>
                  <div className="data-item">
                    <label>Registration Number:</label>
                    <span>{extractedData.registrationNumber}</span>
                  </div>
                  <div className="data-item">
                    <label>Registration Date:</label>
                    <span>{extractedData.registrationDate}</span>
                  </div>
                </div>

                <div className="data-group">
                  <h3>Owner Information</h3>
                  <div className="data-item">
                    <label>Owner Name:</label>
                    <span>{extractedData.ownerName}</span>
                  </div>
                  <div className="data-item">
                    <label>Plot Number:</label>
                    <span>{extractedData.plotNumber}</span>
                  </div>
                </div>

                <div className="data-group">
                  <h3>Land Details</h3>
                  <div className="data-item">
                    <label>Total Area:</label>
                    <span>{extractedData.area}</span>
                  </div>
                  <div className="data-item">
                    <label>Land Use:</label>
                    <span>{extractedData.landUse}</span>
                  </div>
                </div>

                <div className="data-group">
                  <h3>Location</h3>
                  <div className="data-item">
                    <label>Municipality:</label>
                    <span>{extractedData.municipality}</span>
                  </div>
                  <div className="data-item">
                    <label>Ward:</label>
                    <span>{extractedData.ward}</span>
                  </div>
                  <div className="data-item">
                    <label>District:</label>
                    <span>{extractedData.district}</span>
                  </div>
                </div>

                <div className="data-group full-width">
                  <h3>Boundaries</h3>
                  <div className="boundaries-grid">
                    <div className="boundary-item">
                      <label>East:</label>
                      <span>{extractedData.boundaries.east}</span>
                    </div>
                    <div className="boundary-item">
                      <label>West:</label>
                      <span>{extractedData.boundaries.west}</span>
                    </div>
                    <div className="boundary-item">
                      <label>North:</label>
                      <span>{extractedData.boundaries.north}</span>
                    </div>
                    <div className="boundary-item">
                      <label>South:</label>
                      <span>{extractedData.boundaries.south}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons for exporting, saving, or scanning new document */}
              <div className="action-buttons">
                <button className="btn-export">Export as PDF</button>
                <button className="btn-save">Save to Database</button>
                <button className="btn-new" onClick={handleReset}>Scan New Document</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRForm;
