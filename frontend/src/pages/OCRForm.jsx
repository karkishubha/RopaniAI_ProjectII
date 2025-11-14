import React, { useState } from 'react';
import './OCRForm.css';
import { FaUpload, FaFileAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

/**
 * OCRForm Component:
 * 
 * This component handles the document upload and OCR (Optical Character Recognition) 
 * functionality for land documents. It allows users to:
 * 1. Upload documents via drag-and-drop or file browser
 * 2. Preview uploaded documents
 * 3. Extract text/data from documents using OCR
 * 4. Display extracted information in a structured format
 */
const OCRForm = () => {
  // State for the uploaded file object
  const [file, setFile] = useState(null);
  
  // State for base64 preview of the uploaded image (to display in browser)
  const [preview, setPreview] = useState(null);
  
  // State for storing the data extracted from OCR processing
  const [extractedData, setExtractedData] = useState(null);
  
  // State to track if OCR extraction is in progress (shows loading spinner)
  const [loading, setLoading] = useState(false);
  
  // State to track if user is currently dragging a file over the drop zone
  const [dragActive, setDragActive] = useState(false);

  /**
   * Handle file selection from the file input dialog
   * 
   * @param {Event} e - The change event from the file input
   * 
   * Uses optional chaining (?.) to safely access files[0] in case no file is selected
   * This prevents errors if the user cancels the file dialog
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  /**
   * Process the uploaded file and create a preview
   * 
   * @param {File} selectedFile - The file object to process
   * 
   * Uses FileReader API to convert the file into a base64 data URL
   * This allows us to display the image in an <img> tag without uploading to server first
   * 
   * FileReader.readAsDataURL() converts the file to a base64 string like:
   * "data:image/jpeg;base64,/9j/4AAQSkZJRg..." which can be used as img src
   */
  const processFile = (selectedFile) => {
    setFile(selectedFile);
    
    // Create preview using FileReader API
    const reader = new FileReader();
    
    // Set up callback for when file is successfully read
    reader.onload = (e) => {
      // e.target.result contains the base64 data URL
      setPreview(e.target.result);
    };
    
    // Start reading the file and convert to data URL (base64)
    reader.readAsDataURL(selectedFile);
  };

  /**
   * Handle drag events for the drop zone
   * 
   * @param {DragEvent} e - The drag event
   * 
   * preventDefault() and stopPropagation() prevent default browser behavior
   * (like opening the file in a new tab) and stop the event from bubbling up
   * 
   * We track different drag events:
   * - dragenter: when file enters the drop zone
   * - dragover: when file is being dragged over the drop zone
   * - dragleave: when file leaves the drop zone
   * 
   * These events help us provide visual feedback (highlight drop zone) to the user
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true); // Highlight the drop zone
    } else if (e.type === 'dragleave') {
      setDragActive(false); // Remove highlight
    }
  };

  /**
   * Handle file drop event
   * 
   * @param {DragEvent} e - The drop event
   * 
   * e.dataTransfer.files contains the dropped files
   * We only process the first file ([0]) if multiple files are dropped
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false); // Remove drag highlight
    
    // Check if files were actually dropped (not just text or other data)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Extract data from the uploaded document using OCR
   * 
   * TODO: Replace this mock function with actual API call to backend OCR service
   * 
   * In production, this function should:
   * 1. Create a FormData object with the file
   * 2. Send POST request to backend OCR endpoint (e.g., /api/ocr/extract)
   * 3. Receive and parse the extracted data from the response
   * 
   * Currently uses setTimeout to simulate API delay (2 seconds) for better UX testing
   * 
   * The mock data structure shows the expected format for Nepali land documents:
   * - Area format: "Ropani-Aana-Paisa-Dam" (traditional Nepali land measurement units)
   * - Registration date: BS (Bikram Sambat - Nepali calendar)
   * - Boundaries: Four cardinal directions (East, West, North, South)
   */
  const handleExtractData = async () => {
    if (!file) return; // Guard clause: don't proceed if no file is uploaded

    setLoading(true); // Show loading spinner
    
    // TODO: Replace with actual API call
    // Example:
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch('/api/ocr/extract', {
    //   method: 'POST',
    //   body: formData
    // });
    // const data = await response.json();
    // setExtractedData(data);
    
    // Simulate API call with 2 second delay
    setTimeout(() => {
      // Mock extracted data representing a typical Nepali land document
      setExtractedData({
        documentType: 'Land Ownership Certificate',
        ownerName: 'Ram Prasad Sharma',
        plotNumber: '123-45-678',
        area: '5-2-3-1 (5 Ropani, 2 Aana, 3 Paisa, 1 Dam)', // Traditional Nepali measurement
        location: 'Kathmandu, Bagmati Pradesh',
        municipality: 'Kathmandu Metropolitan City',
        ward: '12',
        district: 'Kathmandu',
        registrationDate: '2078-05-15', // Bikram Sambat (Nepali calendar)
        registrationNumber: 'REG-2078-1234',
        landUse: 'Residential',
        boundaries: { // Land boundaries in four directions
          east: 'Road (Sadak)',
          west: 'Hari Bahadur Land',
          north: 'Sita Devi Land',
          south: 'Community Land'
        }
      });
      setLoading(false); // Hide loading spinner
    }, 2000);
  };

  /**
   * Reset the form to initial state
   * 
   * Clears all state variables to allow user to upload a new document
   * Called when user clicks "Scan New Document" button
   */
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
          {/* Upload Section */}
          <div className="upload-section">
            <h2>Upload Document</h2>
            
            {/* 
              Drop Zone for drag-and-drop file upload
              
              Dynamic className uses template literals to conditionally add classes:
              - 'active': adds highlight styling when user drags file over zone
              - 'has-file': changes styling when a file is already uploaded
              
              Multiple drag event handlers are needed to properly track drag state:
              - onDragEnter: fires when dragged item enters the element
              - onDragLeave: fires when dragged item leaves the element
              - onDragOver: fires continuously while item is over the element (needed to allow drop)
              - onDrop: fires when user releases the dragged item
            */}
            <div 
              className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Conditional rendering: Show upload UI or file preview based on file state */}
              {!file ? (
                <>
                  {/* Upload UI - shown when no file is uploaded */}
                  <FaUpload className="upload-icon" />
                  <p className="upload-text">Drag and drop your document here</p>
                  <p className="upload-subtext">or</p>
                  
                  {/* 
                    Hidden file input trick:
                    The actual <input type="file"> is hidden with display: none
                    We use a <label> that triggers the input when clicked
                    This allows us to style the file input with custom CSS
                  */}
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
                <>
                  {/* File preview - shown when file is uploaded */}
                  <div className="file-preview">
                    <FaFileAlt className="file-icon" />
                    <div className="file-details">
                      <p className="file-name">{file.name}</p>
                      {/* Convert file size from bytes to KB with 2 decimal places */}
                      <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button className="btn-remove" onClick={handleReset}>
                      <FaTimesCircle />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 
              Extract button - conditionally rendered
              Only shows when:
              1. File is uploaded (file exists)
              2. Data hasn't been extracted yet (!extractedData)
              
              This prevents showing the button again after extraction is complete
            */}
            {file && !extractedData && (
              <button 
                className="btn-extract" 
                onClick={handleExtractData}
                disabled={loading} // Disable button during extraction to prevent multiple clicks
              >
                {/* Conditional button content based on loading state */}
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

            {/* 
              Preview Section - conditionally rendered
              Uses the base64 data URL stored in 'preview' state as img src
              The src contains the full image data, so no server request is needed
            */}
            {preview && (
              <div className="image-preview">
                <h3>Document Preview</h3>
                <div className="preview-container">
                  <img src={preview} alt="Document preview" />
                </div>
              </div>
            )}
          </div>

          {/* 
            Extracted Data Section - conditionally rendered
            Only shows after successful OCR extraction (when extractedData is not null)
            
            This section displays all the extracted information in a structured grid layout
            organized into logical groups (Document Details, Owner Info, Land Details, etc.)
          */}
          {extractedData && (
            <div className="extracted-section">
              <div className="extracted-header">
                <FaCheckCircle className="success-icon" />
                <div>
                  <h2>Extracted Information</h2>
                  <p>Data extracted successfully from your document</p>
                </div>
              </div>

              {/* 
                Data Grid - displays extracted information in organized groups
                Each data-group represents a category of information from the document
              */}
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

                {/* 
                  Boundaries section - uses 'full-width' class to span entire grid
                  
                  Land boundaries are crucial in Nepali land documents
                  Shows what property/landmark borders each side of the land plot
                  Uses nested object access: extractedData.boundaries.east, etc.
                */}
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

              {/* 
                Action buttons for post-extraction operations
                
                TODO: Implement these button functionalities:
                - Export as PDF: Generate a PDF report of the extracted data
                - Save to Database: Send extracted data to backend for storage
                - Scan New Document: Reset form (already implemented)
              */}
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
