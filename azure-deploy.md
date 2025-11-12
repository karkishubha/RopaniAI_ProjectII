# Azure Deployment Guide - RopaniAI Project

## Prerequisites

1. **Azure Account**: Sign up at [portal.azure.com](https://portal.azure.com)
2. **Azure CLI**: Install from [docs.microsoft.com/cli/azure/install-azure-cli](https://docs.microsoft.com/cli/azure/install-azure-cli)
3. **GitHub Account**: Your code should be pushed to GitHub

---

## Part 1: Deploy Backend to Azure App Service (Docker)

### Step 1: Login to Azure CLI

```bash
az login
```

### Step 2: Create Resource Group

```bash
az group create --name ropani-rg --location southeastasia
```

### Step 3: Create Azure Container Registry (ACR)

```bash
az acr create --resource-group ropani-rg --name ropaniregistry --sku Basic
az acr login --name ropaniregistry
```

### Step 4: Build and Push Docker Image

```bash
# Navigate to backend directory
cd c:\Users\ACER\OneDrive\Desktop\rag-backend

# Build Docker image
docker build -t ropaniregistry.azurecr.io/ropani-backend:latest .

# Push to ACR
docker push ropaniregistry.azurecr.io/ropani-backend:latest
```

### Step 5: Create App Service Plan

```bash
az appservice plan create --name ropani-plan --resource-group ropani-rg --is-linux --sku B1
```

### Step 6: Create Web App

```bash
az webapp create --resource-group ropani-rg --plan ropani-plan --name ropani-backend --deployment-container-image-name ropaniregistry.azurecr.io/ropani-backend:latest
```

### Step 7: Configure Container Settings

```bash
# Enable container logging
az webapp log config --name ropani-backend --resource-group ropani-rg --docker-container-logging filesystem

# Configure registry credentials
az webapp config container set --name ropani-backend --resource-group ropani-rg --docker-custom-image-name ropaniregistry.azurecr.io/ropani-backend:latest --docker-registry-server-url https://ropaniregistry.azurecr.io
```

---

## Part 2: Deploy Databases

### A. PostgreSQL Database

```bash
az postgres flexible-server create \
  --resource-group ropani-rg \
  --name ropani-postgres \
  --location southeastasia \
  --admin-user postgres \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --resource-group ropani-rg \
  --server-name ropani-postgres \
  --database-name rag

# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group ropani-rg \
  --name ropani-postgres \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### B. MySQL Database

```bash
az mysql flexible-server create \
  --resource-group ropani-rg \
  --name ropani-mysql \
  --location southeastasia \
  --admin-user root \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 8.0.21 \
  --storage-size 32

# Create database
az mysql flexible-server db create \
  --resource-group ropani-rg \
  --server-name ropani-mysql \
  --database-name ropani_marketplace

# Allow Azure services
az mysql flexible-server firewall-rule create \
  --resource-group ropani-rg \
  --name ropani-mysql \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### C. Redis Cache

```bash
az redis create \
  --resource-group ropani-rg \
  --name ropani-redis \
  --location southeastasia \
  --sku Basic \
  --vm-size c0

# Get connection string
az redis list-keys --resource-group ropani-rg --name ropani-redis
```

### D. Qdrant Vector DB (Container Instances)

```bash
az container create \
  --resource-group ropani-rg \
  --name ropani-qdrant \
  --image qdrant/qdrant:latest \
  --cpu 1 \
  --memory 1 \
  --ports 6333 6334 \
  --dns-name-label ropani-qdrant \
  --environment-variables QDRANT__SERVICE__HTTP_PORT=6333 QDRANT__SERVICE__GRPC_PORT=6334
```

---

## Part 3: Configure Environment Variables

```bash
# Set environment variables for App Service
az webapp config appsettings set --resource-group ropani-rg --name ropani-backend --settings \
  DB_URL="postgresql://postgres:YourSecurePassword123!@ropani-postgres.postgres.database.azure.com/rag?sslmode=require" \
  MYSQL_HOST="ropani-mysql.mysql.database.azure.com" \
  MYSQL_USER="root" \
  MYSQL_PASSWORD="YourSecurePassword123!" \
  MYSQL_DATABASE="ropani_marketplace" \
  REDIS_HOST="ropani-redis.redis.cache.windows.net" \
  REDIS_PORT="6380" \
  REDIS_PASSWORD="<from-az-redis-list-keys>" \
  QDRANT_URL="http://ropani-qdrant.southeastasia.azurecontainer.io:6333" \
  HF_API_KEY="your_huggingface_key" \
  COHERE_API_KEY="your_cohere_key" \
  USE_COHERE="true"
```

---

## Part 4: Deploy Frontend to Azure Static Web Apps

### Method 1: Using Azure Portal (Easiest)

1. Go to [portal.azure.com](https://portal.azure.com)
2. Click **"Create a resource"** → **"Static Web App"**
3. Configure:
   - **Resource Group**: ropani-rg
   - **Name**: ropani-frontend
   - **Region**: Southeast Asia
   - **Source**: GitHub
   - **Repository**: karkishubha/RopaniAI_ProjectII
   - **Branch**: main
   - **Build Preset**: React
   - **App location**: /frontend
   - **Output location**: dist
4. Click **"Review + Create"**

### Method 2: Using Azure CLI

```bash
az staticwebapp create \
  --name ropani-frontend \
  --resource-group ropani-rg \
  --source https://github.com/karkishubha/RopaniAI_ProjectII \
  --location southeastasia \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist" \
  --login-with-github
```

### Step 2: Configure Frontend Environment Variables

1. In Azure Portal → Static Web Apps → Configuration
2. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ropani-backend.azurewebsites.net`

---

## Part 5: Update Frontend API Configuration

Update `frontend/src/services/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://ropani-backend.azurewebsites.net';
```

---

## Part 6: Enable CORS on Backend

Update `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ropani-frontend.azurestaticapps.net"  # Add your Static Web App URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Rebuild and push Docker image:

```bash
docker build -t ropaniregistry.azurecr.io/ropani-backend:latest .
docker push ropaniregistry.azurecr.io/ropani-backend:latest
az webapp restart --name ropani-backend --resource-group ropani-rg
```

---

## Part 7: Verify Deployment

1. **Backend API**: `https://ropani-backend.azurewebsites.net/docs`
2. **Frontend**: `https://ropani-frontend.azurestaticapps.net`

### Test Endpoints:

```bash
# Health check
curl https://ropani-backend.azurewebsites.net/

# API docs
https://ropani-backend.azurewebsites.net/docs
```

---

## 🔧 Troubleshooting

### Check App Service Logs:

```bash
az webapp log tail --name ropani-backend --resource-group ropani-rg
```

### Check Container Logs:

```bash
az container logs --resource-group ropani-rg --name ropani-qdrant
```

### Restart Services:

```bash
az webapp restart --name ropani-backend --resource-group ropani-rg
az container restart --resource-group ropani-rg --name ropani-qdrant
```

---

## 📊 Cost Optimization Tips

### Use Free Tiers:
1. **PostgreSQL Free Tier**: Burstable B1ms (limited availability)
2. **Static Web Apps**: Always free
3. **App Service Free Tier**: F1 (limited, no custom domains)

### Alternative: Single Database
- Use PostgreSQL for everything (remove MySQL)
- Saves ~$13/month

### Alternative: Serverless
- Use Azure Functions instead of App Service
- Pay per execution (~$0-5/month for low traffic)

---

## 🚀 Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Variables
RESOURCE_GROUP="ropani-rg"
LOCATION="southeastasia"
ACR_NAME="ropaniregistry"
BACKEND_NAME="ropani-backend"
FRONTEND_NAME="ropani-frontend"

# Login
az login

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create and configure ACR
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic
az acr login --name $ACR_NAME

# Build and push
docker build -t $ACR_NAME.azurecr.io/ropani-backend:latest .
docker push $ACR_NAME.azurecr.io/ropani-backend:latest

# Create App Service
az appservice plan create --name ropani-plan --resource-group $RESOURCE_GROUP --is-linux --sku B1
az webapp create --resource-group $RESOURCE_GROUP --plan ropani-plan --name $BACKEND_NAME --deployment-container-image-name $ACR_NAME.azurecr.io/ropani-backend:latest

# Deploy frontend
az staticwebapp create --name $FRONTEND_NAME --resource-group $RESOURCE_GROUP --source https://github.com/karkishubha/RopaniAI_ProjectII --location $LOCATION --branch main --app-location "/frontend" --output-location "dist"

echo "✅ Deployment complete!"
echo "Backend: https://$BACKEND_NAME.azurewebsites.net"
echo "Frontend: https://$FRONTEND_NAME.azurestaticapps.net"
```

---

## 📝 Next Steps After Deployment

1. ✅ Set up custom domain (optional)
2. ✅ Enable SSL/HTTPS (automatic with Azure)
3. ✅ Configure monitoring and alerts
4. ✅ Set up CI/CD pipeline with GitHub Actions
5. ✅ Configure backup for databases
6. ✅ Add Application Insights for monitoring

---

## 🔐 Security Checklist

- [ ] Use Azure Key Vault for secrets (API keys, passwords)
- [ ] Enable SSL/TLS for all services
- [ ] Configure firewall rules for databases
- [ ] Enable managed identity for App Service
- [ ] Set up Azure Active Directory authentication (optional)
- [ ] Enable DDoS protection
- [ ] Regular security updates for Docker images

---

## 📞 Support Resources

- **Azure Documentation**: [docs.microsoft.com/azure](https://docs.microsoft.com/azure)
- **Azure Pricing Calculator**: [azure.microsoft.com/pricing/calculator](https://azure.microsoft.com/pricing/calculator)
- **Azure Support**: [portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade](https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade)

---

**Estimated Setup Time**: 1-2 hours
**Monthly Cost**: $0-75 depending on tier selection
