# RopaniAI Azure Deployment Script
# Run this after restarting your terminal

Write-Host "🚀 RopaniAI Azure Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$RESOURCE_GROUP = "ropani-rg"
$LOCATION = "southeastasia"
$ACR_NAME = "ropaniregistry$(Get-Random -Minimum 1000 -Maximum 9999)"
$BACKEND_NAME = "ropani-backend-$(Get-Random -Minimum 1000 -Maximum 9999)"
$POSTGRES_NAME = "ropani-postgres-$(Get-Random -Minimum 1000 -Maximum 9999)"
$MYSQL_NAME = "ropani-mysql-$(Get-Random -Minimum 1000 -Maximum 9999)"
$REDIS_NAME = "ropani-redis-$(Get-Random -Minimum 1000 -Maximum 9999)"
$QDRANT_NAME = "ropani-qdrant"
$ADMIN_PASSWORD = "RopaniAI@2025$(Get-Random -Minimum 100 -Maximum 999)"

Write-Host "📝 Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Location: $LOCATION"
Write-Host "  Backend: $BACKEND_NAME"
Write-Host "  Admin Password: $ADMIN_PASSWORD (save this!)"
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Logging in to Azure..." -ForegroundColor Green
az login
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Login failed!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Create Resource Group
Write-Host "Step 2: Creating Resource Group..." -ForegroundColor Green
az group create --name $RESOURCE_GROUP --location $LOCATION
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create resource group!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Resource Group created!" -ForegroundColor Green
Write-Host ""

# Step 3: Create PostgreSQL Database
Write-Host "Step 3: Creating PostgreSQL Database (this may take 5-10 minutes)..." -ForegroundColor Green
az postgres flexible-server create `
  --resource-group $RESOURCE_GROUP `
  --name $POSTGRES_NAME `
  --location $LOCATION `
  --admin-user postgres `
  --admin-password $ADMIN_PASSWORD `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --version 15 `
  --storage-size 32 `
  --public-access 0.0.0.0-255.255.255.255

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create PostgreSQL!" -ForegroundColor Red; exit 1 }

# Create database
az postgres flexible-server db create `
  --resource-group $RESOURCE_GROUP `
  --server-name $POSTGRES_NAME `
  --database-name rag

Write-Host "✅ PostgreSQL created!" -ForegroundColor Green
Write-Host ""

# Step 4: Create MySQL Database
Write-Host "Step 4: Creating MySQL Database (this may take 5-10 minutes)..." -ForegroundColor Green
az mysql flexible-server create `
  --resource-group $RESOURCE_GROUP `
  --name $MYSQL_NAME `
  --location $LOCATION `
  --admin-user root `
  --admin-password $ADMIN_PASSWORD `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --version 8.0.21 `
  --storage-size 32 `
  --public-access 0.0.0.0-255.255.255.255

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create MySQL!" -ForegroundColor Red; exit 1 }

# Create database
az mysql flexible-server db create `
  --resource-group $RESOURCE_GROUP `
  --server-name $MYSQL_NAME `
  --database-name ropani_marketplace

Write-Host "✅ MySQL created!" -ForegroundColor Green
Write-Host ""

# Step 5: Create Redis Cache
Write-Host "Step 5: Creating Redis Cache..." -ForegroundColor Green
az redis create `
  --resource-group $RESOURCE_GROUP `
  --name $REDIS_NAME `
  --location $LOCATION `
  --sku Basic `
  --vm-size c0

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create Redis!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Redis created!" -ForegroundColor Green
Write-Host ""

# Step 6: Create Container Registry
Write-Host "Step 6: Creating Container Registry..." -ForegroundColor Green
az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create ACR!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Container Registry created!" -ForegroundColor Green
Write-Host ""

# Step 7: Build and Push Docker Image
Write-Host "Step 7: Building and pushing Docker image..." -ForegroundColor Green
az acr login --name $ACR_NAME

docker build -t "$ACR_NAME.azurecr.io/ropani-backend:latest" .
docker push "$ACR_NAME.azurecr.io/ropani-backend:latest"

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to push image!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Docker image pushed!" -ForegroundColor Green
Write-Host ""

# Step 8: Create App Service Plan
Write-Host "Step 8: Creating App Service Plan..." -ForegroundColor Green
az appservice plan create `
  --name ropani-plan `
  --resource-group $RESOURCE_GROUP `
  --is-linux `
  --sku B1

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create App Service Plan!" -ForegroundColor Red; exit 1 }
Write-Host "✅ App Service Plan created!" -ForegroundColor Green
Write-Host ""

# Step 9: Create Web App
Write-Host "Step 9: Creating Web App..." -ForegroundColor Green

# Get ACR credentials
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan ropani-plan `
  --name $BACKEND_NAME `
  --deployment-container-image-name "$ACR_NAME.azurecr.io/ropani-backend:latest" `
  --docker-registry-server-user $ACR_USERNAME `
  --docker-registry-server-password $ACR_PASSWORD

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create Web App!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Web App created!" -ForegroundColor Green
Write-Host ""

# Step 10: Get Connection Strings
Write-Host "Step 10: Getting connection strings..." -ForegroundColor Green
$POSTGRES_HOST = "$POSTGRES_NAME.postgres.database.azure.com"
$MYSQL_HOST = "$MYSQL_NAME.mysql.database.azure.com"
$REDIS_HOST = "$REDIS_NAME.redis.cache.windows.net"
$REDIS_KEY = az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query primaryKey -o tsv

# Step 11: Create Qdrant Container
Write-Host "Step 11: Creating Qdrant Container..." -ForegroundColor Green
az container create `
  --resource-group $RESOURCE_GROUP `
  --name $QDRANT_NAME `
  --image qdrant/qdrant:latest `
  --cpu 1 `
  --memory 1 `
  --ports 6333 6334 `
  --dns-name-label "ropani-qdrant-$(Get-Random -Minimum 1000 -Maximum 9999)" `
  --environment-variables QDRANT__SERVICE__HTTP_PORT=6333 QDRANT__SERVICE__GRPC_PORT=6334

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to create Qdrant!" -ForegroundColor Red; exit 1 }

$QDRANT_URL = az container show --resource-group $RESOURCE_GROUP --name $QDRANT_NAME --query "ipAddress.fqdn" -o tsv
Write-Host "✅ Qdrant created!" -ForegroundColor Green
Write-Host ""

# Step 12: Configure Environment Variables
Write-Host "Step 12: Configuring environment variables..." -ForegroundColor Green
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $BACKEND_NAME `
  --settings `
    "DB_URL=postgresql://postgres:$ADMIN_PASSWORD@${POSTGRES_HOST}/rag?sslmode=require" `
    "MYSQL_HOST=$MYSQL_HOST" `
    "MYSQL_USER=root" `
    "MYSQL_PASSWORD=$ADMIN_PASSWORD" `
    "MYSQL_DATABASE=ropani_marketplace" `
    "REDIS_HOST=$REDIS_HOST" `
    "REDIS_PORT=6380" `
    "REDIS_PASSWORD=$REDIS_KEY" `
    "QDRANT_URL=http://${QDRANT_URL}:6333" `
    "HF_API_KEY=$env:HF_API_KEY" `
    "COHERE_API_KEY=$env:COHERE_API_KEY" `
    "USE_COHERE=true"

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to configure app settings!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Environment variables configured!" -ForegroundColor Green
Write-Host ""

# Step 13: Restart Web App
Write-Host "Step 13: Restarting Web App..." -ForegroundColor Green
az webapp restart --resource-group $RESOURCE_GROUP --name $BACKEND_NAME
Write-Host "✅ Web App restarted!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Save these details:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend URL: https://$BACKEND_NAME.azurewebsites.net" -ForegroundColor White
Write-Host "API Docs: https://$BACKEND_NAME.azurewebsites.net/docs" -ForegroundColor White
Write-Host ""
Write-Host "Database Credentials:" -ForegroundColor Yellow
Write-Host "  Admin Password: $ADMIN_PASSWORD" -ForegroundColor White
Write-Host "  PostgreSQL: $POSTGRES_HOST" -ForegroundColor White
Write-Host "  MySQL: $MYSQL_HOST" -ForegroundColor White
Write-Host "  Redis: $REDIS_HOST" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy frontend to Azure Static Web Apps (see instructions below)" -ForegroundColor White
Write-Host "2. Update CORS settings in app/main.py" -ForegroundColor White
Write-Host "3. Test your API at the URL above" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue to frontend deployment..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Frontend Deployment Instructions
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "FRONTEND DEPLOYMENT (Manual Steps)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://portal.azure.com" -ForegroundColor Yellow
Write-Host "2. Click 'Create a resource' → Search 'Static Web App'" -ForegroundColor Yellow
Write-Host "3. Configure:" -ForegroundColor Yellow
Write-Host "   - Resource Group: $RESOURCE_GROUP" -ForegroundColor White
Write-Host "   - Name: ropani-frontend" -ForegroundColor White
Write-Host "   - Region: Southeast Asia" -ForegroundColor White
Write-Host "   - Source: GitHub" -ForegroundColor White
Write-Host "   - Repository: karkishubha/RopaniAI_ProjectII" -ForegroundColor White
Write-Host "   - Branch: main" -ForegroundColor White
Write-Host "   - Build Preset: React" -ForegroundColor White
Write-Host "   - App location: /frontend" -ForegroundColor White
Write-Host "   - Output location: dist" -ForegroundColor White
Write-Host "4. Add environment variable in Static Web App → Configuration:" -ForegroundColor Yellow
Write-Host "   - Name: VITE_API_URL" -ForegroundColor White
Write-Host "   - Value: https://$BACKEND_NAME.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "✅ Deployment script completed!" -ForegroundColor Green
