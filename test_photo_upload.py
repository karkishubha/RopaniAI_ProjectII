"""
Test photo upload functionality
"""
import requests
import base64
from PIL import Image
import io

# API base URL
BASE_URL = "http://localhost:8000/api/marketplace"

def create_test_image():
    """Create a simple test image"""
    # Create a red square image
    img = Image.new('RGB', (400, 300), color='red')
    
    # Add some text
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(img)
    draw.text((150, 140), "Test Land Photo", fill='white')
    
    # Save to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    
    return img_byte_arr

def test_photo_upload():
    """Test uploading a photo to listing #1"""
    print("="*60)
    print("🏡 Testing Photo Upload Functionality")
    print("="*60)
    print()
    
    # Create test image
    print("📸 Creating test image...")
    image_data = create_test_image()
    print(f"✅ Test image created ({len(image_data)} bytes)")
    print()
    
    # Upload photo to listing #1
    listing_id = 1
    print(f"📤 Uploading photo to listing #{listing_id}...")
    
    files = {
        'file': ('test_land.jpg', image_data, 'image/jpeg')
    }
    data = {
        'caption': 'Beautiful land view',
        'is_primary': 'true'
    }
    
    response = requests.post(
        f"{BASE_URL}/listings/{listing_id}/photos",
        files=files,
        data=data
    )
    
    if response.status_code == 201:
        result = response.json()
        print("✅ Photo uploaded successfully!")
        print(f"   Photo ID: {result['id']}")
        print(f"   Type: {result['photo_type']}")
        print(f"   Primary: {result['is_primary']}")
        print(f"   Message: {result['message']}")
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"   {response.text}")
        return
    
    print()
    
    # Get photos for the listing
    print(f"📥 Fetching photos for listing #{listing_id}...")
    response = requests.get(f"{BASE_URL}/listings/{listing_id}/photos")
    
    if response.status_code == 200:
        photos = response.json()
        print(f"✅ Found {len(photos)} photo(s)")
        for i, photo in enumerate(photos, 1):
            print(f"\n   Photo {i}:")
            print(f"   - ID: {photo['id']}")
            print(f"   - Type: {photo['photo_type']}")
            print(f"   - Caption: {photo.get('caption', 'N/A')}")
            print(f"   - Primary: {photo['is_primary']}")
            print(f"   - Data size: {len(photo['photo_data'])} characters")
    else:
        print(f"❌ Failed to fetch photos: {response.status_code}")
    
    print()
    
    # Get listing with photos
    print(f"📋 Fetching listing #{listing_id} with photos...")
    response = requests.get(f"{BASE_URL}/listings/{listing_id}")
    
    if response.status_code == 200:
        listing = response.json()
        print(f"✅ Listing retrieved successfully")
        print(f"   Title: {listing['title']}")
        print(f"   Photos attached: {len(listing.get('photos', []))}")
    else:
        print(f"❌ Failed to fetch listing: {response.status_code}")
    
    print()
    print("="*60)
    print("✅ Photo upload test completed!")
    print("="*60)

if __name__ == "__main__":
    try:
        test_photo_upload()
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
