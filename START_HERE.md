# 🚀 MySQL Land Marketplace - Setup Instructions

## ✅ What's Already Done

1. ✅ MySQL dependencies installed (`pymysql`, `cryptography`)
2. ✅ Database models created
3. ✅ API endpoints configured
4. ✅ Frontend integrated
5. ✅ `.env` file updated with MySQL configuration

## 🔧 What You Need to Do

### Step 1: Set Your MySQL Password

Open the `.env` file and add your MySQL root password:

```env
MYSQL_PASSWORD=your_actual_password_here
```

**To edit .env:**
```powershell
notepad .env
```

Find the line `MYSQL_PASSWORD=` and add your MySQL password.

### Step 2: Initialize the Database

Run this command to create the database and tables:

```powershell
python init_mysql_db.py
```

**Expected Output:**
```
============================================================
🏡 Ropani AI - Land Marketplace Database Initialization
============================================================

Step 1: Creating database...
✅ Database 'ropani_marketplace' created successfully!

Step 2: Creating tables...
✅ All tables created successfully!

Tables created:
  - land_listings
  - transactions
  - price_negotiations
  - saved_searches
  - favorites

Step 3: Inserting sample data...
✅ Sample data inserted successfully!
   Inserted 3 sample listings

============================================================
✅ Database initialization completed successfully!
============================================================

Database Details:
  Host: localhost
  Port: 3306
  Database: ropani_marketplace
  User: root

You can now start using the Land Marketplace API!
```

### Step 3: Restart Backend

Since we added new API routes, restart the backend:

```powershell
# If using Docker:
docker-compose restart backend

# OR if running locally:
# Press Ctrl+C to stop current server, then:
uvicorn app.main:app --reload
```

### Step 4: Test the API

Open a new PowerShell window and test:

```powershell
# Test statistics endpoint
Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/stats" -Method GET

# Get all listings
Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/listings" -Method GET
```

**Expected Response for stats:**
```json
{
  "total_active_listings": 3,
  "sold_properties": 0,
  "active_transactions": 0,
  "completed_transactions": 0
}
```

### Step 5: Test Frontend

1. Make sure frontend is running:
   ```powershell
   cd frontend
   npm run dev
   ```

2. Open browser: **http://localhost:3000/marketplace**

3. You should see:
   - ✅ 3 sample land listings
   - ✅ Working filters
   - ✅ "List Your Land" button

### Step 6: Test Creating a Listing

1. Click "List Your Land" button
2. Fill out the form:
   - Title: "My Test Land"
   - Province: Select any
   - District: Select any
   - Municipality: Select any
   - Fill in required fields
3. Click "Submit Listing & Get ML Price"
4. Should see success message with ML price
5. New listing appears in browse view

## 📊 Verify in MySQL Workbench

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Run these queries:

```sql
-- See the database
SHOW DATABASES;

-- Use the marketplace database
USE ropani_marketplace;

-- See all tables
SHOW TABLES;

-- View all listings
SELECT id, title, province, district, current_price, status 
FROM land_listings;

-- View transactions (should be empty initially)
SELECT * FROM transactions;
```

## 🎯 Quick Test Checklist

- [ ] `.env` has MySQL password
- [ ] `python init_mysql_db.py` runs successfully
- [ ] Backend restarted (shows marketplace routes in startup logs)
- [ ] `http://localhost:8000/docs` shows marketplace endpoints
- [ ] `http://localhost:8000/api/marketplace/stats` returns data
- [ ] Frontend shows 3 sample listings
- [ ] Can create new listing via UI
- [ ] New listing appears immediately
- [ ] Can adjust prices
- [ ] MySQL Workbench shows data

## 🔥 Common Issues & Solutions

### Issue: "Access denied for user 'root'@'localhost'"
**Solution:** Wrong MySQL password in `.env`
```powershell
# Edit .env and set correct password
notepad .env
```

### Issue: "Unknown database 'ropani_marketplace'"
**Solution:** Database not created yet
```powershell
python init_mysql_db.py
```

### Issue: "No module named 'pymysql'"
**Solution:** Install dependencies
```powershell
pip install pymysql cryptography
```

### Issue: "Failed to load listings" in frontend
**Solution:** Backend not running or wrong port
```powershell
# Check if backend is running
curl http://localhost:8000/health

# If not, start it
docker-compose up -d
# OR
uvicorn app.main:app --reload
```

### Issue: Frontend shows old data
**Solution:** Clear browser cache or hard refresh
- Press `Ctrl + Shift + R` (Windows)
- Or `Cmd + Shift + R` (Mac)

## 📚 API Documentation

Once backend is running, visit:
**http://localhost:8000/docs**

You'll see all marketplace endpoints with:
- Interactive testing
- Request/response examples
- Schema definitions

### Key Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/listings` | Get all listings with filters |
| GET | `/api/marketplace/listings/{id}` | Get specific listing |
| POST | `/api/marketplace/listings` | Create new listing |
| PATCH | `/api/marketplace/listings/{id}/price` | Adjust price |
| POST | `/api/marketplace/transactions` | Start purchase |
| GET | `/api/marketplace/stats` | Get statistics |

## 🎨 Features to Test

### 1. Browse Listings
- View all properties
- See property cards with details
- Click to view full details

### 2. Filter Properties
- Filter by province/district/municipality
- Filter by price range
- Filter by area
- Filter by amenities (road, water, electricity)
- Filter by land type (residential/commercial/agricultural)

### 3. Create Listing
- Fill comprehensive form
- Get ML price suggestion
- See listing appear immediately

### 4. View Property Details
- Complete specifications
- Location information
- Amenities status
- Document availability
- Legal procedures guide
- Owner contact

### 5. Price Negotiation
- Adjust price with +/- buttons
- Changes saved to database
- Price history tracked

## 📈 What the ML Model Does

Current algorithm calculates price based on:

```
Base Price = Area × Price Per Unit

Adjustments:
+ 10% for road access
+ 5%  for water supply
+ 5%  for electricity
+ 20% for commercial zone
+ 10% for residential zone
+ 10% for wide road (≥15 feet)

Final Price = Base Price × (1 + adjustments)
```

## 🚀 Next Steps After Setup

1. **Test Everything:**
   - Create 5-10 test listings
   - Try different filters
   - Test price adjustments
   - Verify data in MySQL Workbench

2. **Customize:**
   - Add your own sample data
   - Adjust ML algorithm
   - Customize UI styling

3. **Enhance:**
   - Add image upload
   - Integrate real ML model
   - Add user authentication
   - Implement payment gateway

## 📁 Project Structure

```
rag-backend/
├── app/
│   ├── db/
│   │   ├── mysql_session.py      ← MySQL connection
│   │   └── mysql_models.py       ← Marketplace models
│   ├── api/
│   │   └── marketplace.py        ← API endpoints
│   └── main.py                   ← Added marketplace router
├── frontend/
│   └── src/
│       ├── services/
│       │   └── marketplaceAPI.js ← API client
│       └── pages/
│           └── LandMarketplace.jsx ← UI component
├── init_mysql_db.py              ← Database setup script
├── .env                          ← Configuration (add password!)
└── MYSQL_SETUP_GUIDE.md          ← Detailed guide
```

## 💡 Pro Tips

1. **Use MySQL Workbench** to monitor data in real-time
2. **Check FastAPI logs** to see API requests
3. **Use browser DevTools** (F12) to debug frontend issues
4. **Test API with Postman** or `Invoke-RestMethod` before testing UI

## 🎉 Success Criteria

You know everything is working when:

1. ✅ Database initialization completes without errors
2. ✅ API docs show marketplace endpoints
3. ✅ Stats endpoint returns correct numbers
4. ✅ Frontend displays 3 sample listings
5. ✅ You can create a new listing
6. ✅ New listing appears immediately
7. ✅ Price adjustments work
8. ✅ MySQL Workbench shows all data

## 📞 Quick Commands Reference

```powershell
# Initialize database
python init_mysql_db.py

# Start backend
docker-compose up -d
# OR
uvicorn app.main:app --reload

# Start frontend
cd frontend
npm run dev

# Test API
Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/stats"

# View logs
docker-compose logs backend
```

## 🆘 Need Help?

Check these files:
- `MYSQL_SETUP_GUIDE.md` - Comprehensive setup guide
- `MYSQL_INTEGRATION_SUMMARY.md` - Technical details
- `MARKETPLACE_FEATURE.md` - Feature documentation

---

## Ready to Start? 🚀

Run these commands in order:

```powershell
# 1. Add MySQL password to .env
notepad .env

# 2. Initialize database
python init_mysql_db.py

# 3. Restart backend
docker-compose restart backend

# 4. Test API
Invoke-RestMethod -Uri "http://localhost:8000/api/marketplace/stats"

# 5. Open frontend
# Navigate to http://localhost:3000/marketplace
```

**That's it! Your MySQL-powered Land Marketplace is ready!** 🎉
