# Deployment Guide - RopaniAI (Free Hosting)

## 🚀 Deployment Strategy

- **Frontend**: Vercel (Free)
- **Backend**: Render.com (Free tier)
- **Databases**: Render.com managed services

---

## 📦 Part 1: Deploy Backend to Render.com

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository: `karkishubha/RopaniAI_ProjectII`

### Step 2: Create Web Service (Backend)
1. Click **"New +"** → **"Web Service"**
2. Connect repository: `RopaniAI_ProjectII`
3. Configure:
   - **Name**: `ropani-backend`
   - **Region**: Singapore (closest to Nepal)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`

4. **Environment Variables** (Add these):
   ```
   COHERE_API_KEY=your_cohere_api_key
   HF_API_KEY=your_huggingface_api_key
   USE_COHERE=true
   MYSQL_HOST=ropani-mysql (from Render MySQL service)
   MYSQL_USER=root
   MYSQL_PASSWORD=<from Render MySQL>
   MYSQL_DATABASE=ropani_marketplace
   REDIS_HOST=ropani-redis (from Render Redis)
   REDIS_PORT=6379
   DB_URL=postgresql://user:pass@host/db (from Render PostgreSQL)
   QDRANT_URL=http://ropani-qdrant:6333
   ```

5. Click **"Create Web Service"**

### Step 3: Create Databases on Render

#### PostgreSQL Database
1. **New +** → **PostgreSQL**
2. Name: `ropani-postgres`
3. Database: `rag`
4. Plan: **Free**
5. Copy connection string to `DB_URL` env variable

#### Redis (Use Redis Labs Free Tier)
1. Go to [redis.com/try-free](https://redis.com/try-free/)
2. Create free database
3. Copy connection details to `REDIS_HOST` env variable

**Note**: Render free tier doesn't include Redis/MySQL/Qdrant as managed services. You'll need to:
- Use external free Redis (Redis Labs)
- Use Render PostgreSQL only (store marketplace data there too)
- Run Qdrant in the same Docker container (ephemeral)

### Alternative: Use PostgreSQL for Everything
Update your backend to use PostgreSQL for marketplace data instead of MySQL.

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Update API URL
1. Create `.env.production` in `frontend/`:
   ```
   VITE_API_URL=https://ropani-backend.onrender.com
   ```

2. Update `frontend/src/config/api.js`:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
   ```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import `RopaniAI_ProjectII`
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables**:
   ```
   VITE_API_URL=https://ropani-backend.onrender.com
   ```
7. Click **"Deploy"**

---

## ⚠️ Free Tier Limitations

### Render.com Free Tier:
- ✅ 750 hours/month (enough for 1 service)
- ❌ Spins down after 15 minutes of inactivity (cold starts ~30s)
- ❌ Only 1 free web service
- ✅ 1 free PostgreSQL database (1GB)

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Global CDN

### Workarounds for Limitations:
1. **Cold Start Issue**: First request takes 30s. Add a "Loading" message.
2. **No MySQL/Redis/Qdrant on free tier**: 
   - Option A: Use PostgreSQL for everything
   - Option B: Use external free services (Redis Labs, Aiven)
   - Option C: Run all services in one Docker container (not recommended for production)

---

## 🔧 Recommended Changes for Free Deployment

### Simplify Database Stack:
Instead of PostgreSQL + MySQL + Redis + Qdrant, use:
- **PostgreSQL**: For both RAG data AND marketplace data
- **In-memory cache**: Replace Redis with Python dict (not persistent but free)
- **SQLite or PostgreSQL**: For vector storage instead of Qdrant

Would you like me to help you:
1. Simplify the database stack for free hosting?
2. Set up the deployment step-by-step?
3. Create modified Dockerfile for single-container deployment?
