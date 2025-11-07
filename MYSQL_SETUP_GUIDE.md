# MySQL Database Setup for Land Marketplace

## Prerequisites
- MySQL Server installed and running
- MySQL Workbench (already opened)
- Python environment with backend dependencies

## Step-by-Step Setup

### 1. Configure MySQL Connection

Open `.env` file in the rag-backend folder and add these MySQL configuration variables:

```env
# MySQL Configuration for Land Marketplace
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=ropani_marketplace
```

**Replace `your_password_here` with your actual MySQL root password.**

### 2. Install Required Python Packages

Open PowerShell in the rag-backend directory and run:

```powershell
cd C:\Users\ACER\OneDrive\Desktop\rag-backend
pip install pymysql cryptography
```

Or reinstall all requirements:
```powershell
pip install -r requirements.txt
```

### 3. Initialize the Database

Run the initialization script:

```powershell
python init_mysql_db.py
```

This script will:
- ✅ Create the `ropani_marketplace` database
- ✅ Create all required tables:
  - `land_listings` - Store all land properties
  - `transactions` - Track buying processes
  - `price_negotiations` - Record price changes
  - `saved_searches` - Save user search preferences
  - `favorites` - User favorite properties
- ✅ Insert 3 sample land listings

### 4. Verify Database in MySQL Workbench

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. You should see the `ropani_marketplace` database
4. Explore the tables:
   ```sql
   USE ropani_marketplace;
   SHOW TABLES;
   SELECT * FROM land_listings;
   ```

### 5. Start the Backend Server

Make sure Docker containers are running:
```powershell
cd C:\Users\ACER\OneDrive\Desktop\rag-backend
docker-compose up -d
```

Start the FastAPI backend:
```powershell
# If using Docker
docker-compose restart backend

# OR if running locally
uvicorn app.main:app --reload
```

### 6. Test the API

Open browser or use PowerShell to test:

**Get all listings:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/listings" -Method GET
```

**Get marketplace stats:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/stats" -Method GET
```

**Create a new listing (example):**
```powershell
$body = @{
    title = "Test Land"
    province = "Bagmati Pradesh"
    district = "Kathmandu"
    municipality = "Kathmandu Metropolitan"
    ward = 1
    area = 3.0
    area_unit = "aana"
    price_per_unit = 5000000.0
    kitta_number = "999"
    plot_number = "888"
    road_access = $true
    water_supply = $true
    electricity = $true
    residential_zone = $true
    commercial_zone = $false
    agricultural_zone = $false
    owner_name = "Test Owner"
    owner_phone = "9800000000"
    owner_email = "test@example.com"
    documents = @{
        land_ownership_certificate = $true
        tax_clearance_certificate = $true
        character_certificate = $false
        cadastral_map = $true
        no_objection_certificate = $false
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/listings" -Method POST -ContentType "application/json" -Body $body
```

### 7. Start the Frontend

```powershell
cd frontend
npm run dev
```

Navigate to: `http://localhost:3000/marketplace`

## Database Schema

### land_listings Table
- **id** - Primary key
- **title** - Property title
- **description** - Detailed description
- **province, district, municipality, ward** - Location details
- **area, area_unit** - Land size (aana, ropani, bigha, sqft, sqm)
- **price_per_unit, base_price, ml_suggested_price, current_price** - Pricing info
- **kitta_number, plot_number** - Legal identifiers
- **road_width, road_access, water_supply, electricity** - Amenities
- **residential_zone, commercial_zone, agricultural_zone** - Land type
- **owner_name, owner_phone, owner_email** - Owner contact
- **Document flags** - Certificate availability
- **status** - active, pending, sold, cancelled
- **listed_date, updated_at** - Timestamps

### transactions Table
- **id** - Primary key
- **land_listing_id** - Foreign key to land_listings
- **buyer_name, buyer_phone, buyer_email, buyer_address** - Buyer info
- **agreed_price, advance_payment** - Transaction amounts
- **status** - pending, in_progress, completed, cancelled
- **Legal procedure flags** (10 steps):
  - ownership_verified
  - documents_verified
  - site_inspected
  - price_negotiated
  - sale_agreement_signed
  - payment_completed
  - registration_done
  - transfer_certificate_obtained
  - records_updated
  - tax_paid
- **notes** - Additional information
- **created_at, updated_at, completed_at** - Timestamps

### price_negotiations Table
- Tracks all price adjustment history
- Links to land_listing_id
- Records previous price, offered price, adjustment amount
- Tracks negotiator information

## API Endpoints

### Land Listings
- `GET /api/marketplace/listings` - Get all listings (with filters)
- `GET /api/marketplace/listings/{id}` - Get specific listing
- `POST /api/marketplace/listings` - Create new listing
- `PATCH /api/marketplace/listings/{id}/price` - Adjust price
- `DELETE /api/marketplace/listings/{id}` - Cancel listing

### Transactions
- `POST /api/marketplace/transactions` - Start purchase process
- `GET /api/marketplace/transactions/{id}` - Get transaction details
- `PATCH /api/marketplace/transactions/{id}` - Update progress
- `GET /api/marketplace/listings/{id}/transactions` - Get listing transactions

### Statistics
- `GET /api/marketplace/stats` - Get marketplace statistics

## Query Parameters for Filtering

When getting listings, you can filter by:
- `province` - Province name
- `district` - District name  
- `municipality` - Municipality name
- `min_price` - Minimum price
- `max_price` - Maximum price
- `min_area` - Minimum area
- `max_area` - Maximum area
- `road_access` - Boolean
- `water_supply` - Boolean
- `electricity` - Boolean
- `residential_zone` - Boolean
- `commercial_zone` - Boolean
- `agricultural_zone` - Boolean
- `status` - active (default), pending, sold, cancelled
- `skip` - Pagination offset (default: 0)
- `limit` - Max results (default: 100)

Example:
```
GET /api/marketplace/listings?province=Bagmati%20Pradesh&min_price=10000000&road_access=true
```

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
- Check MySQL password in `.env` file
- Ensure MySQL server is running

### Error: "Unknown database 'ropani_marketplace'"
- Run `python init_mysql_db.py` to create database

### Error: "No module named 'pymysql'"
- Install: `pip install pymysql cryptography`

### Error: "Can't connect to MySQL server"
- Verify MySQL is running in MySQL Workbench
- Check MYSQL_HOST and MYSQL_PORT in `.env`

### Frontend shows "Failed to load listings"
- Ensure backend is running on port 8000
- Check browser console for detailed errors
- Verify API is responding: http://localhost:8000/api/marketplace/listings

## Data Flow

1. **User fills listing form** → Frontend validates → Sends POST to `/api/marketplace/listings`
2. **Backend receives** → Calculates ML price → Saves to MySQL → Returns listing with ID
3. **Frontend displays** → Fetches all listings → Applies local filters → Shows cards
4. **User clicks property** → Shows detailed view → Can adjust price
5. **Price adjustment** → PATCH request → Updates MySQL → Records negotiation → Returns new price
6. **User buys** → POST to `/api/marketplace/transactions` → Creates transaction → Updates listing status

## Production Considerations

1. **Security:**
   - Change MySQL password
   - Use environment variables for sensitive data
   - Add user authentication
   - Implement CSRF protection

2. **Performance:**
   - Add database indexes on frequently queried fields
   - Implement caching with Redis
   - Add pagination for large datasets

3. **Features to Add:**
   - Image upload for properties
   - Map integration
   - Email notifications
   - Payment gateway
   - User dashboard

## Database Maintenance

**Backup database:**
```sql
mysqldump -u root -p ropani_marketplace > marketplace_backup.sql
```

**Restore database:**
```sql
mysql -u root -p ropani_marketplace < marketplace_backup.sql
```

**View statistics:**
```sql
USE ropani_marketplace;

-- Total listings
SELECT COUNT(*) FROM land_listings;

-- Active listings by province
SELECT province, COUNT(*) as count 
FROM land_listings 
WHERE status = 'active' 
GROUP BY province;

-- Average prices
SELECT AVG(current_price) as avg_price, 
       MIN(current_price) as min_price, 
       MAX(current_price) as max_price 
FROM land_listings 
WHERE status = 'active';

-- Recent transactions
SELECT * FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

---

**Setup Complete!** 🎉

Your Land Marketplace is now connected to MySQL database and ready to use.
