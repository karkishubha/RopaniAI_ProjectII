import React, { useState, useRef } from 'react';
import { FaCamera, FaUpload, FaTrash, FaStar, FaRegStar, FaTimes, FaImage } from 'react-icons/fa';
import './PhotoUpload.css';
import marketplaceService from '../services/marketplaceAPI';

const PhotoUpload = ({ listingId, onPhotosUpdate, existingPhotos = [] }) => {
  const [photos, setPhotos] = useState(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    setError('');
    setPreviewFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewFile) {
      setError('Please select a file');
      return;
    }

    if (!listingId) {
      setError('Listing must be created first before uploading photos');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await marketplaceService.uploadPhoto(
        listingId,
        previewFile,
        caption,
        isPrimary
      );

      // Fetch updated photos
      const updatedPhotos = await marketplaceService.getPhotos(listingId);
      setPhotos(updatedPhotos);
      
      if (onPhotosUpdate) {
        onPhotosUpdate(updatedPhotos);
      }

      // Reset form
      setPreviewFile(null);
      setPreviewUrl(null);
      setCaption('');
      setIsPrimary(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Photo uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await marketplaceService.deletePhoto(listingId, photoId);
      
      // Update local state
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      
      if (onPhotosUpdate) {
        onPhotosUpdate(updatedPhotos);
      }

      alert('Photo deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete photo');
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      await marketplaceService.setPrimaryPhoto(listingId, photoId);
      
      // Update local state
      const updatedPhotos = photos.map(p => ({
        ...p,
        is_primary: p.id === photoId
      }));
      setPhotos(updatedPhotos);
      
      if (onPhotosUpdate) {
        onPhotosUpdate(updatedPhotos);
      }

      alert('Primary photo updated');
    } catch (err) {
      console.error('Set primary error:', err);
      alert('Failed to set primary photo');
    }
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
    setCaption('');
    setIsPrimary(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="photo-upload-container">
      <h3><FaCamera /> Land Photos</h3>
      
      {/* Upload Section */}
      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            id="photo-upload-input"
          />
          <label htmlFor="photo-upload-input" className="file-input-label">
            <FaImage /> Choose Photo
          </label>
          <span className="file-size-hint">Max 5MB • JPEG, PNG, WebP</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {previewUrl && (
          <div className="preview-section">
            <div className="preview-image-wrapper">
              <img src={previewUrl} alt="Preview" className="preview-image" />
              <button 
                className="cancel-preview-btn"
                onClick={cancelPreview}
                type="button"
              >
                <FaTimes />
              </button>
            </div>

            <div className="preview-controls">
              <div className="form-group">
                <label>Caption (optional)</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe this photo..."
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    disabled={uploading}
                  />
                  Set as primary photo
                </label>
              </div>

              <button
                className="upload-btn"
                onClick={handleUpload}
                disabled={uploading || !listingId}
                type="button"
              >
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <><FaUpload /> Upload Photo</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Section */}
      {photos.length > 0 && (
        <div className="photos-gallery">
          <h4>Uploaded Photos ({photos.length})</h4>
          <div className="photos-grid">
            {photos
              .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
              .map((photo) => (
                <div key={photo.id} className="photo-item">
                  <div className="photo-wrapper">
                    <img
                      src={`data:${photo.photo_type};base64,${photo.photo_data}`}
                      alt={photo.caption || 'Land photo'}
                      className="photo-thumbnail"
                    />
                    {photo.is_primary && (
                      <div className="primary-badge">
                        <FaStar /> Primary
                      </div>
                    )}
                  </div>
                  
                  {photo.caption && (
                    <p className="photo-caption">{photo.caption}</p>
                  )}
                  
                  <div className="photo-actions">
                    {!photo.is_primary && (
                      <button
                        className="action-btn primary-btn"
                        onClick={() => handleSetPrimary(photo.id)}
                        title="Set as primary"
                      >
                        <FaRegStar />
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(photo.id)}
                      title="Delete photo"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {photos.length === 0 && !previewUrl && (
        <div className="no-photos-message">
          <FaCamera />
          <p>No photos uploaded yet</p>
          <p className="hint">Upload photos to showcase your land</p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
