# AWS Deployment Files - Overview

Complete AWS deployment configuration for the RopaniAI project.

## 📁 File Structure

```
rag-backend/
├── AWS-DEPLOYMENT.md           # Comprehensive deployment guide
├── AWS-QUICKSTART.md           # Quick 30-minute deployment guide
├── AWS-ENV-VARIABLES.md        # Environment variables & secrets
├── deploy-aws.ps1              # Automated deployment script
├── ecs-task-definition.json    # ECS task config for backend
├── qdrant-task-definition.json # ECS task config for Qdrant
├── cloudfront-config.json      # CloudFront CDN configuration
├── cloudwatch-dashboard.json   # Monitoring dashboard
└── .github/
    └── workflows/
        └── deploy-aws.yml      # CI/CD pipeline
```

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```powershell
# Clone and navigate to project
cd C:\Users\ACER\OneDrive\Desktop\rag-backend

# Run automated deployment
.\deploy-aws.ps1 -Region ap-south-1

# Follow the on-screen instructions
# Time: ~25 minutes (includes database creation)
```

### Option 2: Manual Step-by-Step

Follow the guide in [`AWS-QUICKSTART.md`](./AWS-QUICKSTART.md)

## 📚 Documentation Guide

### For First-Time Deployment
1. Start with **AWS-QUICKSTART.md** - fastest path to deployment
2. Reference **AWS-ENV-VARIABLES.md** for secrets setup
3. Use **deploy-aws.ps1** script for automation

### For Production Setup
1. Read **AWS-DEPLOYMENT.md** - complete architecture overview
2. Customize **ecs-task-definition.json** with your settings
3. Set up **deploy-aws.yml** CI/CD pipeline
4. Configure **cloudwatch-dashboard.json** for monitoring

### For Troubleshooting
- **AWS-DEPLOYMENT.md** - Troubleshooting section
- **AWS-QUICKSTART.md** - Common issues and solutions

## 🎯 What Each File Does

### `AWS-DEPLOYMENT.md` (13,000+ words)
**Purpose**: Complete production-ready deployment guide

**Contains**:
- ✅ Full architecture diagram and explanation
- ✅ Detailed cost breakdown ($113/month production, ~$50 free tier)
- ✅ Step-by-step AWS CLI commands for all services
- ✅ Security best practices
- ✅ SSL/HTTPS setup with ACM
- ✅ Auto-scaling configuration
- ✅ Monitoring and logging setup
- ✅ Troubleshooting guide

**Use When**: Setting up production environment, need deep understanding

---

### `AWS-QUICKSTART.md` (Simplified)
**Purpose**: Get deployed in under 30 minutes

**Contains**:
- ✅ Prerequisites checklist
- ✅ Quick automated deployment option
- ✅ Essential manual steps only
- ✅ Verification commands
- ✅ Update and cleanup procedures

**Use When**: Quick testing, development environment, first deployment

---

### `AWS-ENV-VARIABLES.md`
**Purpose**: Complete environment variable reference

**Contains**:
- ✅ All environment variables needed
- ✅ AWS Secrets Manager setup commands
- ✅ GitHub Secrets configuration
- ✅ Security best practices
- ✅ Environment-specific configs (dev/staging/prod)

**Use When**: Configuring secrets, updating API keys, managing environments

---

### `deploy-aws.ps1` (PowerShell Script)
**Purpose**: Automated infrastructure provisioning

**What It Does**:
1. ✅ Creates VPC with subnets and Internet Gateway
2. ✅ Sets up security groups
3. ✅ Creates ECR repository
4. ✅ Builds and pushes Docker image
5. ✅ Provisions RDS PostgreSQL & MySQL
6. ✅ Creates ElastiCache Redis
7. ✅ Sets up ECS cluster
8. ✅ Configures CloudWatch logging

**Usage**:
```powershell
# Full deployment
.\deploy-aws.ps1 -Region ap-south-1

# Skip databases (faster)
.\deploy-aws.ps1 -SkipDatabases

# Custom region
.\deploy-aws.ps1 -Region us-east-1
```

---

### `ecs-task-definition.json`
**Purpose**: ECS Fargate task configuration for backend

**Specifications**:
- **CPU**: 1 vCPU (1024 units)
- **Memory**: 2 GB
- **Image**: FastAPI backend from ECR
- **Port**: 8000
- **Secrets**: Integrated with Secrets Manager
- **Logging**: CloudWatch logs to `/ecs/ropani-backend`
- **Health Check**: Checks `/docs` endpoint every 30s

**Update Required**:
- Replace `ACCOUNT_ID` with your AWS account ID
- Update secret ARNs after creating secrets

---

### `qdrant-task-definition.json`
**Purpose**: ECS Fargate task for Qdrant vector database

**Specifications**:
- **CPU**: 0.5 vCPU (512 units)
- **Memory**: 1 GB
- **Image**: qdrant/qdrant:latest
- **Ports**: 6333 (HTTP), 6334 (gRPC)
- **Storage**: EFS volume for persistence

**Note**: Requires EFS file system creation (see deployment guide)

---

### `cloudfront-config.json`
**Purpose**: CloudFront CDN distribution configuration

**Features**:
- ✅ HTTPS redirect
- ✅ Gzip compression
- ✅ Optimized caching (assets: 1 year, HTML: no cache)
- ✅ SPA routing (404 → index.html)
- ✅ Global edge locations
- ✅ HTTP/2 and HTTP/3 support

**Usage**:
```powershell
aws cloudfront create-distribution `
  --distribution-config file://cloudfront-config.json
```

---

### `cloudwatch-dashboard.json`
**Purpose**: Monitoring dashboard for all services

**Metrics Tracked**:
- **ECS**: CPU/Memory utilization
- **ALB**: Response time, request count
- **RDS**: Connections, CPU, memory
- **ElastiCache**: Connections, CPU, network
- **CloudFront**: Requests, errors, bandwidth
- **Application**: Custom error metrics

**Usage**:
```powershell
aws cloudwatch put-dashboard `
  --dashboard-name RopaniAI-Dashboard `
  --dashboard-body file://cloudwatch-dashboard.json
```

---

### `.github/workflows/deploy-aws.yml`
**Purpose**: GitHub Actions CI/CD pipeline

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Pipeline Steps**:

**Backend Job**:
1. ✅ Checkout code
2. ✅ Configure AWS credentials
3. ✅ Login to ECR
4. ✅ Build Docker image
5. ✅ Push to ECR (with git SHA tag + latest)
6. ✅ Update ECS task definition
7. ✅ Deploy to ECS with zero-downtime
8. ✅ Wait for deployment to stabilize

**Frontend Job**:
1. ✅ Checkout code
2. ✅ Setup Node.js 18 with npm cache
3. ✅ Get ALB URL dynamically
4. ✅ Build React app with correct API URL
5. ✅ Sync to S3 (static assets: 1-year cache, HTML: no-cache)
6. ✅ Invalidate CloudFront cache

**GitHub Secrets Required**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `CLOUDFRONT_DISTRIBUTION_ID`

---

## 💰 Cost Breakdown by File

### Infrastructure Created by `deploy-aws.ps1`
| Resource | Monthly Cost |
|----------|--------------|
| VPC, Subnets, IGW | $0 (free) |
| ECR (5GB) | $0.50 |
| RDS PostgreSQL | $15 |
| RDS MySQL | $15 |
| ElastiCache Redis | $12 |
| **Subtotal** | **$42.50** |

### Additional Manual Setup
| Resource | Monthly Cost |
|----------|--------------|
| ECS Fargate (backend) | $30 |
| ECS Fargate (Qdrant) | $15 |
| Application Load Balancer | $18 |
| S3 + CloudFront | $3 |
| Secrets Manager | $1.60 |
| CloudWatch Logs | $2.50 |
| **Subtotal** | **$70.10** |

### **Total Monthly Cost**: ~$113

### Free Tier Savings (First 12 months)
- RDS: 750hrs/month free → **Save $30**
- ElastiCache: 750hrs/month free → **Save $12**
- ALB: 750hrs/month free → **Save $18**
- S3: 5GB free → **Save $1**
- CloudFront: 1TB free → **Save $2**

**Free Tier Total**: ~$53/month (ECS Fargate not eligible)

---

## 🔧 Deployment Workflow

### Initial Setup (One-Time)
```powershell
# 1. Configure AWS CLI
aws configure

# 2. Run deployment script
.\deploy-aws.ps1

# 3. Update task definitions with outputs
# Edit ecs-task-definition.json with account ID and endpoints

# 4. Create Secrets Manager secrets
# Follow AWS-ENV-VARIABLES.md

# 5. Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# 6. Create ALB and ECS service
# Follow AWS-QUICKSTART.md steps 2-3

# 7. Deploy frontend
# Follow AWS-QUICKSTART.md step 5

# 8. Set up CloudFront (optional)
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json

# 9. Configure CI/CD
# Add GitHub secrets from AWS-ENV-VARIABLES.md
```

### Daily Updates (Automated via CI/CD)
```bash
# Just push to main branch
git add .
git commit -m "Update feature"
git push origin main

# GitHub Actions automatically:
# 1. Builds new Docker image
# 2. Pushes to ECR
# 3. Updates ECS service
# 4. Builds and deploys frontend
# 5. Invalidates CloudFront cache
```

### Manual Updates
```powershell
# Backend only
docker build -t ropani-backend:latest .
docker tag ropani-backend:latest <ECR_URI>:latest
docker push <ECR_URI>:latest
aws ecs update-service --cluster ropani-cluster --service ropani-backend-service --force-new-deployment

# Frontend only
cd frontend
npm run build
aws s3 sync dist/ s3://ropani-frontend-prod/ --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

---

## 🎓 Learning Path

### Beginner (Just want it deployed)
1. Read: `AWS-QUICKSTART.md`
2. Run: `.\deploy-aws.ps1`
3. Follow: Manual steps 1-6 from Quick Start
4. Done! Your app is live

### Intermediate (Understanding the setup)
1. Read: `AWS-DEPLOYMENT.md` sections 1-6
2. Customize: `ecs-task-definition.json`
3. Set up: `deploy-aws.yml` CI/CD
4. Configure: `cloudwatch-dashboard.json`

### Advanced (Production optimization)
1. Read: `AWS-DEPLOYMENT.md` sections 7-11
2. Implement: Auto-scaling
3. Set up: Multi-region deployment
4. Configure: WAF and Shield
5. Optimize: Costs with Reserved Instances

---

## 📊 Monitoring After Deployment

### View Dashboard
```powershell
# Open CloudWatch dashboard
start https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=RopaniAI-Dashboard
```

### Check Backend Logs
```powershell
# Tail live logs
aws logs tail /ecs/ropani-backend --follow

# Search for errors
aws logs filter-log-events `
  --log-group-name /ecs/ropani-backend `
  --filter-pattern "ERROR"
```

### View Costs
```powershell
# Current month costs
aws ce get-cost-and-usage `
  --time-period Start=2025-11-01,End=2025-11-30 `
  --granularity MONTHLY `
  --metrics BlendedCost
```

---

## 🆘 Troubleshooting Quick Reference

| Issue | File to Check | Command |
|-------|---------------|---------|
| Deployment fails | `AWS-QUICKSTART.md` | `aws ecs describe-services` |
| Database connection | `AWS-ENV-VARIABLES.md` | `aws rds describe-db-instances` |
| High costs | `AWS-DEPLOYMENT.md` | `aws ce get-cost-and-usage` |
| Frontend not loading | `cloudfront-config.json` | `aws cloudfront get-distribution` |
| ECS task fails | `ecs-task-definition.json` | `aws logs tail /ecs/ropani-backend` |
| CI/CD not working | `deploy-aws.yml` | Check GitHub Actions logs |

---

## 🔄 Update Checklist

When updating deployment:

- [ ] Update `ecs-task-definition.json` if changing resources
- [ ] Update `AWS-ENV-VARIABLES.md` if adding new secrets
- [ ] Update `deploy-aws.ps1` if changing infrastructure
- [ ] Update `.github/workflows/deploy-aws.yml` if changing CI/CD
- [ ] Update `cloudfront-config.json` if changing caching
- [ ] Test changes in staging environment first
- [ ] Update this README with lessons learned

---

## 📝 Notes

- **Region**: Default is `ap-south-1` (Mumbai), change in scripts if needed
- **Account ID**: Replace `ACCOUNT_ID` in all JSON files with your AWS account ID
- **Secrets**: Never commit actual secrets to Git
- **Costs**: Monitor regularly, set up billing alarms
- **Backups**: RDS automated backups enabled (7-day retention)

---

## 🔗 External Resources

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [CloudFront Performance](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/performance.html)
- [GitHub Actions for AWS](https://github.com/aws-actions)

---

**Last Updated**: November 12, 2025  
**Maintained By**: RopaniAI Team  
**License**: MIT
