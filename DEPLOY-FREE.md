# 🆓 Free Deployment Guide (No Credit Card Required)

## Best Options for Students

### 🥇 Option 1: Railway.app (Recommended)

**Why Railway?**
- ✅ $5/month free credit (500 hours)
- ✅ No credit card needed to start
- ✅ Deploy with 3 clicks
- ✅ Free databases included
- ✅ Auto-deploys from GitHub

**Deploy in 5 Minutes:**

1. **Sign Up**
   - Go to https://railway.app
   - Click "Login with GitHub"
   - Authorize Railway

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `karkishubha/RopaniAI_ProjectII`
   - Railway detects Dockerfile automatically!

3. **Add Databases** (in Railway dashboard)
   - Click "New" → "Database" → "Add PostgreSQL"
   - Click "New" → "Database" → "Add MySQL"
   - Click "New" → "Database" → "Add Redis"

4. **Add Environment Variables**
   - Click on your backend service
   - Go to "Variables" tab
   - Add these:
     ```
     COHERE_API_KEY=your-key
     HF_API_KEY=your-key
     USE_COHERE=true
     ```
   - Railway auto-injects database URLs!

5. **Deploy Frontend**
   - Click "New" → "GitHub Repo"
   - Select same repo
   - Set Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --port $PORT --host 0.0.0.0`

**Done!** Your app is live at `https://your-app.railway.app`

---

### 🥈 Option 2: Render.com

**Steps:**

1. **Backend Deployment**
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - Name: `ropani-backend`
     - Environment: `Docker`
     - Instance Type: `Free`
   - Click "Create Web Service"

2. **Add Free Databases**
   - Click "New +" → "PostgreSQL"
   - Name: `ropani-postgres`
   - Database: `rag`
   - Plan: `Free`
   
   - Click "New +" → "Redis"
   - Name: `ropani-redis`
   - Plan: `Free`

3. **Frontend Deployment**
   - Click "New +" → "Static Site"
   - Connect repo
   - Settings:
     - Build Command: `cd frontend && npm install && npm run build`
     - Publish Directory: `frontend/dist`
   - Environment Variables:
     ```
     VITE_API_URL=https://ropani-backend.onrender.com
     ```

**Note**: Free tier sleeps after 15 min inactivity (wakes in ~30 seconds on request)

---

### 🥉 Option 3: Fly.io

**Install Fly CLI:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Deploy:**
```powershell
# Restart terminal, then:
fly auth signup  # Sign up (no card needed)
fly launch       # Auto-detects Dockerfile
fly deploy       # Deploy!
```

**Add databases:**
```powershell
fly postgres create --name ropani-postgres
fly redis create --name ropani-redis
```

---

### 🎓 Option 4: GitHub Student Developer Pack

**Get FREE credits for all major clouds:**

1. **Apply here**: https://education.github.com/pack

2. **What you get:**
   - $100 Azure credits (1 year, no card!)
   - $100 AWS Educate credits
   - $200 DigitalOcean credits (2 months)
   - Free Heroku Dynos
   - Free .me domain from Namecheap
   - Free Canva Pro
   - Free GitHub Copilot
   - And 80+ more benefits!

3. **Requirements:**
   - Valid student email (.edu or university email)
   - OR student ID card photo
   - GitHub account

4. **Processing time:** Usually approved in 1-3 days

**With Student Pack + Azure:**
- Use the Azure deployment guide I created
- No credit card needed
- $100 credit = ~1.5 months free
- After credit runs out, upgrade or migrate

---

## 📊 Free Tier Comparison

| Service | Backend | Database | Frontend | Card? | Sleep? |
|---------|---------|----------|----------|-------|--------|
| **Railway** | 500hrs/mo | ✅ All | ✅ | No | No |
| **Render** | ✅ Free | PostgreSQL + Redis | ✅ | No | Yes (15min) |
| **Fly.io** | 3 VMs | Paid | ✅ | No | No |
| **Vercel** | ❌ | ❌ | ✅ Best | No | No |
| **Netlify** | ❌ | ❌ | ✅ | No | No |
| **Heroku** | ❌ (ended) | ❌ | ❌ | - | - |

---

## 🚀 Recommended Setup (100% Free)

**Backend + Databases**: Railway.app
- Backend service
- PostgreSQL
- MySQL (or use same PostgreSQL)
- Redis
- Qdrant (as Docker service)

**Frontend**: Vercel or Netlify
- Best performance
- Global CDN
- Auto-deploy from GitHub

### Deploy Backend to Railway

```bash
# Railway auto-detects Dockerfile, just:
1. railway.app → Login with GitHub
2. New Project → Deploy from GitHub
3. Select repo → Auto-deploys!
4. Add databases from Railway dashboard
```

### Deploy Frontend to Vercel

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel login
vercel --prod
```

Or just:
1. Go to https://vercel.com
2. Import Git Repository
3. Select `frontend` folder
4. Add env var: `VITE_API_URL=https://your-railway-app.railway.app`
5. Deploy!

---

## 🔧 Environment Variables for Railway

Railway auto-provides these:
- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL` (Redis)
- `MYSQL_URL` (MySQL)

You need to add:
```env
COHERE_API_KEY=your-cohere-key
HF_API_KEY=your-hf-key
USE_COHERE=true
```

Update `app/config.py` to use Railway's variables:
```python
import os

DB_URL = os.getenv("DATABASE_URL")  # Railway provides this
MYSQL_URL = os.getenv("MYSQL_URL")  # Railway provides this
REDIS_URL = os.getenv("REDIS_URL")  # Railway provides this
```

---

## 💡 Tips for Staying Free

1. **Use Railway for backend** ($5 credit = ~500 hours/month)
2. **Use Vercel/Netlify for frontend** (unlimited free)
3. **Use free APIs**:
   - Cohere: Free tier 100 calls/min
   - HuggingFace: Free tier available
4. **Optimize Docker image** to use less resources
5. **Apply for GitHub Student Pack** for long-term credits

---

## 🎯 Quick Start (Choose One)

### A. Railway (Easiest - 5 minutes)
```
1. Go to railway.app
2. Login with GitHub
3. New Project → Deploy from GitHub → Select repo
4. Add databases (PostgreSQL, Redis)
5. Done!
```

### B. Render (Good - 10 minutes)
```
1. Go to render.com
2. New Web Service → Connect GitHub repo
3. Select Docker environment
4. Add PostgreSQL and Redis databases
5. Deploy frontend as Static Site
```

### C. Fly.io (Developer-friendly - 15 minutes)
```powershell
fly auth signup
fly launch
fly postgres create
fly redis create
fly deploy
```

---

## 🆘 Troubleshooting

**Railway Issues:**
- If build fails: Check Dockerfile syntax
- If app crashes: Check logs in Railway dashboard
- Database connection: Use Railway-provided URLs

**Render Issues:**
- Free tier sleeps: First request takes 30s to wake
- Build timeout: Optimize Docker image size
- Database storage: 1GB limit on free tier

**General:**
- CORS errors: Update `app/main.py` with your frontend URL
- Port issues: Use `$PORT` environment variable
- Memory limits: Optimize your app (reduce package size)

---

## 🎓 Next Steps

1. **Immediate**: Deploy to Railway (5 min)
2. **This week**: Apply for GitHub Student Pack
3. **After approved**: Migrate to Azure with $100 credit
4. **Long-term**: Learn to optimize costs

---

**Recommended Choice**: Railway.app + Vercel
- **Cost**: $0
- **Time**: 10 minutes
- **Card**: Not needed
- **Performance**: Good
- **Scalability**: Limited but sufficient for projects

Ready to deploy to Railway?
