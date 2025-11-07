# Land Photo Upload API Documentation

## Overview
The Land Marketplace now supports photo uploads for land listings. Photos are stored as base64-encoded strings in the MySQL database.

## API Endpoints

### 1. Upload Photo
**Endpoint:** `POST /api/marketplace/listings/{listing_id}/photos`

**Description:** Upload a photo for a specific land listing

**Content-Type:** `multipart/form-data`

**Parameters:**
- `listing_id` (path parameter): ID of the land listing
- `file` (form-data, required): Image file (JPEG, JPG, PNG, or WebP)
- `caption` (form-data, optional): Caption for the photo
- `is_primary` (form-data, optional): Set as primary photo (boolean, default: false)

**File Constraints:**
- Maximum file size: 5MB
- Allowed types: image/jpeg, image/jpg, image/png, image/webp

**Response (201 Created):**
```json
{
  "id": 1,
  "message": "Photo uploaded successfully",
  "photo_type": "image/jpeg",
  "is_primary": true
}
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('caption', 'Beautiful land view');
formData.append('is_primary', 'true');

const response = await fetch(
  `http://localhost:8000/api/marketplace/listings/${listingId}/photos`,
  {
    method: 'POST',
    body: formData
  }
);

const result = await response.json();
console.log('Photo uploaded:', result);
```

**Example (React with Axios):**
```javascript
const uploadPhoto = async (listingId, file, caption, isPrimary) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caption', caption || '');
  formData.append('is_primary', isPrimary ? 'true' : 'false');

  try {
    const response = await axios.post(
      `/api/marketplace/listings/${listingId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

---

### 2. Get All Photos for a Listing
**Endpoint:** `GET /api/marketplace/listings/{listing_id}/photos`

**Description:** Retrieve all photos for a specific land listing

**Parameters:**
- `listing_id` (path parameter): ID of the land listing

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "photo_data": "base64_encoded_string_here...",
    "photo_type": "image/jpeg",
    "caption": "Beautiful land view",
    "is_primary": true,
    "uploaded_at": "2025-11-07T12:00:00"
  },
  {
    "id": 2,
    "photo_data": "base64_encoded_string_here...",
    "photo_type": "image/png",
    "caption": "Another angle",
    "is_primary": false,
    "uploaded_at": "2025-11-07T12:05:00"
  }
]
```

**Example (React):**
```javascript
const fetchPhotos = async (listingId) => {
  const response = await fetch(
    `http://localhost:8000/api/marketplace/listings/${listingId}/photos`
  );
  const photos = await response.json();
  return photos;
};

// Display image from base64
const DisplayPhoto = ({ photo }) => {
  const imageSrc = `data:${photo.photo_type};base64,${photo.photo_data}`;
  
  return (
    <img 
      src={imageSrc} 
      alt={photo.caption || 'Land photo'} 
      className={photo.is_primary ? 'primary-photo' : 'secondary-photo'}
    />
  );
};
```

---

### 3. Delete Photo
**Endpoint:** `DELETE /api/marketplace/listings/{listing_id}/photos/{photo_id}`

**Description:** Delete a specific photo from a listing

**Parameters:**
- `listing_id` (path parameter): ID of the land listing
- `photo_id` (path parameter): ID of the photo to delete

**Response (200 OK):**
```json
{
  "message": "Photo deleted successfully"
}
```

**Example:**
```javascript
const deletePhoto = async (listingId, photoId) => {
  const response = await fetch(
    `http://localhost:8000/api/marketplace/listings/${listingId}/photos/${photoId}`,
    { method: 'DELETE' }
  );
  return response.json();
};
```

---

### 4. Set Primary Photo
**Endpoint:** `PATCH /api/marketplace/listings/{listing_id}/photos/{photo_id}/primary`

**Description:** Set a photo as the primary photo for a listing (automatically unsets other primary photos)

**Parameters:**
- `listing_id` (path parameter): ID of the land listing
- `photo_id` (path parameter): ID of the photo to set as primary

**Response (200 OK):**
```json
{
  "message": "Primary photo updated successfully"
}
```

**Example:**
```javascript
const setPrimaryPhoto = async (listingId, photoId) => {
  const response = await fetch(
    `http://localhost:8000/api/marketplace/listings/${listingId}/photos/${photoId}/primary`,
    { method: 'PATCH' }
  );
  return response.json();
};
```

---

### 5. Get Listing with Photos
**Endpoint:** `GET /api/marketplace/listings/{listing_id}`

**Description:** The existing listing endpoint now includes photos in the response

**Response includes photos array:**
```json
{
  "id": 1,
  "title": "Residential Land in Kathmandu",
  "description": "Prime residential land...",
  "province": "Bagmati Pradesh",
  "district": "Kathmandu",
  // ... other listing fields ...
  "photos": [
    {
      "id": 1,
      "photo_data": "base64_encoded_string...",
      "photo_type": "image/jpeg",
      "caption": "Beautiful land view",
      "is_primary": true,
      "uploaded_at": "2025-11-07T12:00:00"
    }
  ]
}
```

---

## Frontend Implementation Guide

### React Component Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const LandPhotoUpload = ({ listingId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and WebP images are allowed');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('caption', caption);
    formData.append('is_primary', isPrimary ? 'true' : 'false');

    try {
      const response = await axios.post(
        `/api/marketplace/listings/${listingId}/photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('Photo uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setCaption('');
      setIsPrimary(false);
      setPreview(null);
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload-container">
      <h3>Upload Land Photo</h3>
      
      <div className="file-input-wrapper">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>

      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" style={{ maxWidth: '300px' }} />
        </div>
      )}

      <div className="form-group">
        <label>Caption (optional):</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Enter photo caption"
          disabled={uploading}
        />
      </div>

      <div className="form-group">
        <label>
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
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </button>
    </div>
  );
};

export default LandPhotoUpload;
```

### Photo Gallery Component

```jsx
const PhotoGallery = ({ listingId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, [listingId]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(
        `/api/marketplace/listings/${listingId}/photos`
      );
      setPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await axios.delete(
        `/api/marketplace/listings/${listingId}/photos/${photoId}`
      );
      setPhotos(photos.filter(p => p.id !== photoId));
      alert('Photo deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete photo');
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      await axios.patch(
        `/api/marketplace/listings/${listingId}/photos/${photoId}/primary`
      );
      // Refresh photos
      fetchPhotos();
      alert('Primary photo updated');
    } catch (error) {
      console.error('Failed to set primary:', error);
      alert('Failed to set primary photo');
    }
  };

  if (loading) return <div>Loading photos...</div>;
  if (photos.length === 0) return <div>No photos uploaded yet</div>;

  return (
    <div className="photo-gallery">
      {photos.map(photo => (
        <div key={photo.id} className="photo-item">
          <img
            src={`data:${photo.photo_type};base64,${photo.photo_data}`}
            alt={photo.caption || 'Land photo'}
          />
          {photo.is_primary && <span className="badge">Primary</span>}
          {photo.caption && <p className="caption">{photo.caption}</p>}
          <div className="photo-actions">
            {!photo.is_primary && (
              <button onClick={() => handleSetPrimary(photo.id)}>
                Set as Primary
              </button>
            )}
            <button onClick={() => handleDelete(photo.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Database Schema

### land_photos Table
```sql
CREATE TABLE land_photos (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  land_listing_id INTEGER NOT NULL,
  photo_data TEXT NOT NULL,           -- Base64 encoded image
  photo_type VARCHAR(20) NOT NULL,    -- MIME type (image/jpeg, etc.)
  caption VARCHAR(255),                -- Optional caption
  is_primary BOOLEAN DEFAULT FALSE,    -- Primary photo flag
  uploaded_at DATETIME DEFAULT NOW(), -- Upload timestamp
  FOREIGN KEY (land_listing_id) REFERENCES land_listings(id) ON DELETE CASCADE
);
```

---

## Notes

1. **Storage**: Photos are stored as base64-encoded strings in MySQL TEXT columns
2. **Size Limit**: Maximum 5MB per photo (enforced by backend)
3. **Primary Photo**: Only one photo can be primary per listing
4. **Cascade Delete**: Photos are automatically deleted when the listing is deleted
5. **Performance**: For production, consider moving large images to cloud storage (S3, Cloudinary) and storing URLs instead of base64

---

## Testing

Use the provided `test_photo_upload.py` script to test the API:

```bash
python test_photo_upload.py
```

Or test via Swagger UI at: `http://localhost:8000/docs`

---

## Troubleshooting

**Error: "File size too large"**
- Ensure file is under 5MB
- Compress images before upload

**Error: "Invalid file type"**
- Only JPEG, PNG, and WebP are allowed
- Check file MIME type

**Error: "Listing not found"**
- Verify the listing_id exists
- Check listing status (must be active)

---

## Future Enhancements

- [ ] Image compression on upload
- [ ] Multiple photo upload at once
- [ ] Photo reordering
- [ ] Cloud storage integration (S3/Cloudinary)
- [ ] Image thumbnails for list views
- [ ] Photo metadata (EXIF data)
