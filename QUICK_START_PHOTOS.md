# Quick Start - Photo Upload Feature

## 🚀 Quick Testing

### Test Photo Upload (Command Line)
```bash
# Run the test script
python test_photo_upload.py
```

### View API Documentation
Open in browser: http://localhost:8000/docs

### Test with cURL (Windows PowerShell)
```powershell
# Upload a photo
$filePath = "C:\path\to\your\image.jpg"
$listingId = 1

curl.exe -X POST "http://localhost:8000/api/marketplace/listings/$listingId/photos" `
  -F "file=@$filePath" `
  -F "caption=Beautiful view" `
  -F "is_primary=true"

# Get all photos for listing
curl http://localhost:8000/api/marketplace/listings/1/photos

# Get listing with photos
curl http://localhost:8000/api/marketplace/listings/1
```

---

## 📋 Frontend Quick Start

### React Component (Minimal Example)
```jsx
import React, { useState } from 'react';

function PhotoUpload({ listingId }) {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', 'My land photo');
    formData.append('is_primary', 'true');

    const response = await fetch(
      `http://localhost:8000/api/marketplace/listings/${listingId}/photos`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (response.ok) {
      alert('Photo uploaded!');
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])} 
      />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
```

### Display Photos
```jsx
function PhotoGallery({ listingId }) {
  const [photos, setPhotos] = React.useState([]);

  React.useEffect(() => {
    fetch(`http://localhost:8000/api/marketplace/listings/${listingId}/photos`)
      .then(res => res.json())
      .then(data => setPhotos(data));
  }, [listingId]);

  return (
    <div>
      {photos.map(photo => (
        <img 
          key={photo.id}
          src={`data:${photo.photo_type};base64,${photo.photo_data}`}
          alt={photo.caption}
          style={{ maxWidth: '300px', margin: '10px' }}
        />
      ))}
    </div>
  );
}
```

---

## 🔑 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/marketplace/listings/{id}/photos` | Upload photo |
| GET | `/api/marketplace/listings/{id}/photos` | Get all photos |
| GET | `/api/marketplace/listings/{id}` | Get listing with photos |
| DELETE | `/api/marketplace/listings/{id}/photos/{photo_id}` | Delete photo |
| PATCH | `/api/marketplace/listings/{id}/photos/{photo_id}/primary` | Set primary |

---

## ⚠️ Important Limits

- **Max File Size**: 5MB
- **Allowed Types**: JPEG, PNG, WebP
- **Storage**: Base64 in MySQL TEXT column
- **Primary Photos**: One per listing

---

## 🐛 Common Issues

**"File too large"**
→ Compress image to under 5MB

**"Invalid file type"**  
→ Use JPEG, PNG, or WebP only

**"Listing not found"**  
→ Check listing ID exists and is active

**Photos not showing**  
→ Check if photos array is populated in listing response

---

## 📞 Need Help?

- **API Docs**: http://localhost:8000/docs
- **Full Guide**: See `PHOTO_UPLOAD_API.md`
- **Test Script**: Run `python test_photo_upload.py`

---

## ✅ Verification Checklist

Before integrating in frontend:

- [ ] Backend running (http://localhost:8000)
- [ ] Database migration completed
- [ ] Test upload works (`test_photo_upload.py`)
- [ ] Can view photos in API response
- [ ] API documentation accessible

All done? Start building your frontend! 🎉
