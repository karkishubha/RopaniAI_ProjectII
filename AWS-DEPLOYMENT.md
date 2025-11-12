# 🚀 AWS Deployment Guide - RopaniAI Full Stack

Complete production-ready deployment guide for deploying the RopaniAI project to AWS.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Cost Estimates](#cost-estimates)
3. [Prerequisites](#prerequisites)
4. [Backend Deployment (ECS Fargate)](#backend-deployment)
5. [Database Setup (RDS + ElastiCache + ECS)](#database-setup)
6. [Frontend Deployment (S3 + CloudFront)](#frontend-deployment)
7. [Secrets Management](#secrets-management)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring & Logging](#monitoring)
10. [SSL/HTTPS Setup](#ssl-setup)
11. [Scaling & Optimization](#scaling)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront CDN                        │
│                     (Global Edge Locations)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    S3 Static Website                         │
│                  (React Frontend - dist/)                    │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS API Calls
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                 │
│                    (SSL Termination)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    ECS Fargate Cluster                       │
│           ┌──────────────────────────────────┐              │
│           │   FastAPI Backend Container      │              │
│           │   (Auto-scaling: 1-4 tasks)      │              │
│           └──────────────────────────────────┘              │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬──────────────┐
        ▼               ▼               ▼              ▼
┌──────────────┐ ┌─────────────┐ ┌────────────┐ ┌────────────┐
│ RDS PostgreSQL│ │  RDS MySQL  │ │ ElastiCache│ │ ECS Task   │
│   (RAG DB)    │ │(Marketplace)│ │   (Redis)  │ │  (Qdrant)  │
└──────────────┘ └─────────────┘ └────────────┘ └────────────┘
```

### Why This Architecture?

- **ECS Fargate**: Serverless containers, no EC2 management, pay-per-use
- **RDS**: Managed databases with automated backups, multi-AZ for HA
- **ElastiCache**: Managed Redis with automatic failover
- **S3 + CloudFront**: Fastest global frontend delivery, pennies per month
- **ALB**: Health checks, auto-scaling integration, SSL termination
- **Secrets Manager**: Encrypted secrets, automatic rotation

---

## 💰 Cost Estimates

### Monthly Costs (Production)

| Service | Configuration | Cost/Month |
|---------|--------------|------------|
| **ECS Fargate** | 1 vCPU, 2GB RAM, ~730hrs | ~$30 |
| **RDS PostgreSQL** | db.t4g.micro, 20GB SSD | ~$15 |
| **RDS MySQL** | db.t4g.micro, 20GB SSD | ~$15 |
| **ElastiCache Redis** | cache.t4g.micro | ~$12 |
| **ECS Fargate (Qdrant)** | 0.5 vCPU, 1GB RAM | ~$15 |
| **Application Load Balancer** | 730hrs + data transfer | ~$18 |
| **S3 + CloudFront** | 10GB storage, 100GB transfer | ~$3 |
| **Secrets Manager** | 4 secrets | ~$1.60 |
| **CloudWatch Logs** | 5GB/month | ~$2.50 |
| **ECR** | 5GB storage | ~$0.50 |
| **Route 53** | Hosted zone | ~$0.50 |
| **Total** | | **~$113/month** |

### Free Tier (First 12 Months)

If using AWS Free Tier:
- RDS: 750hrs/month db.t2.micro (can run both DBs)
- ElastiCache: 750hrs/month cache.t2.micro
- ALB: 750hrs/month + 15GB data
- S3: 5GB storage, 20k GET, 2k PUT
- CloudFront: 1TB transfer, 10M requests
- **Estimated: ~$45-60/month** (ECS Fargate not free tier eligible)

### Budget Option (~$35/month)

- Use **EC2 t3.small** instead of ECS Fargate (~$15/month)
- Run all databases on single EC2 via Docker Compose
- Skip Load Balancer, use EC2 public IP
- **Trade-off**: Manual management, less scalable

---

## 📦 Prerequisites

### 1. AWS Account Setup

```bash
# Install AWS CLI
# Windows (use installer from aws.amazon.com/cli)
# Or via PowerShell:
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure AWS CLI
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region: ap-south-1 (or your preferred region)
# Default output format: json
```

### 2. Install Required Tools

```bash
# Docker Desktop (already installed)
# AWS CLI (see above)

# Install AWS ECS CLI (optional, for easier ECS management)
# Download from: https://github.com/aws/amazon-ecs-cli

# Install AWS CDK (optional, for infrastructure as code)
npm install -g aws-cdk
```

### 3. Environment Variables Needed

Create `.env.production`:
```env
# Database
DB_URL=postgresql://postgres:PASSWORD@POSTGRES_ENDPOINT/rag
MYSQL_HOST=MYSQL_ENDPOINT
MYSQL_USER=root
MYSQL_PASSWORD=PASSWORD
MYSQL_DATABASE=ropani_marketplace

# Redis
REDIS_HOST=REDIS_ENDPOINT
REDIS_PORT=6379
REDIS_PASSWORD=

# Qdrant
QDRANT_URL=http://QDRANT_TASK_IP:6333

# AI APIs
COHERE_API_KEY=your_cohere_key
HF_API_KEY=your_huggingface_key
USE_COHERE=true
```

---

## 🐳 Backend Deployment (ECS Fargate)

### Step 1: Create ECR Repository

```bash
# Create repository for backend image
aws ecr create-repository \
  --repository-name ropani-backend \
  --region ap-south-1

# Get login token
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
```

### Step 2: Build and Push Docker Image

```bash
# Navigate to project root
cd C:\Users\ACER\OneDrive\Desktop\rag-backend

# Build image
docker build -t ropani-backend:latest .

# Tag image
docker tag ropani-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ropani-backend:latest

# Push to ECR
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ropani-backend:latest
```

### Step 3: Create VPC and Security Groups

```bash
# Create VPC (if you don't have one)
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ropani-vpc}]'

# Note the VPC ID from output
VPC_ID=<your-vpc-id>

# Create subnets (2 for HA)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ap-south-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ropani-subnet-1}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ap-south-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=ropani-subnet-2}]'

# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=ropani-igw}]'

IGW_ID=<your-igw-id>

# Attach to VPC
aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID

# Create security group for backend
aws ec2 create-security-group \
  --group-name ropani-backend-sg \
  --description "Security group for RopaniAI backend" \
  --vpc-id $VPC_ID

BACKEND_SG_ID=<your-sg-id>

# Allow HTTP from ALB
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG_ID \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0
```

### Step 4: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name ropani-cluster \
  --region ap-south-1
```

### Step 5: Create Task Execution Role

```bash
# Create IAM role for ECS task execution
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add Secrets Manager access
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### Step 6: Register Task Definition

Create `ecs-task-definition.json` (see separate file).

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json
```

### Step 7: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name ropani-alb \
  --subnets <subnet-1-id> <subnet-2-id> \
  --security-groups $BACKEND_SG_ID \
  --scheme internet-facing \
  --type application

ALB_ARN=<your-alb-arn>

# Create target group
aws elbv2 create-target-group \
  --name ropani-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /docs \
  --health-check-interval-seconds 30

TG_ARN=<your-target-group-arn>

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### Step 8: Create ECS Service

```bash
# Create service
aws ecs create-service \
  --cluster ropani-cluster \
  --service-name ropani-backend-service \
  --task-definition ropani-backend-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-1-id>,<subnet-2-id>],securityGroups=[$BACKEND_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=ropani-backend,containerPort=8000"
```

### Step 9: Get Backend URL

```bash
# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

Your backend will be available at: `http://<alb-dns-name>`

---

## 🗄️ Database Setup

### PostgreSQL (RDS)

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name ropani-db-subnet-group \
  --db-subnet-group-description "Subnet group for RopaniAI databases" \
  --subnet-ids <subnet-1-id> <subnet-2-id>

# Create security group for databases
aws ec2 create-security-group \
  --group-name ropani-db-sg \
  --description "Security group for RopaniAI databases" \
  --vpc-id $VPC_ID

DB_SG_ID=<your-db-sg-id>

# Allow PostgreSQL from backend
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $BACKEND_SG_ID

# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier ropani-postgres \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 20 \
  --vpc-security-group-ids $DB_SG_ID \
  --db-subnet-group-name ropani-db-subnet-group \
  --backup-retention-period 7 \
  --no-publicly-accessible

# Wait for creation (5-10 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier ropani-postgres

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier ropani-postgres \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### MySQL (RDS)

```bash
# Allow MySQL from backend
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 3306 \
  --source-group $BACKEND_SG_ID

# Create MySQL instance
aws rds create-db-instance \
  --db-instance-identifier ropani-mysql \
  --db-instance-class db.t4g.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username root \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 20 \
  --vpc-security-group-ids $DB_SG_ID \
  --db-subnet-group-name ropani-db-subnet-group \
  --backup-retention-period 7 \
  --no-publicly-accessible

# Wait for creation
aws rds wait db-instance-available \
  --db-instance-identifier ropani-mysql

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier ropani-mysql \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Redis (ElastiCache)

```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name ropani-cache-subnet-group \
  --cache-subnet-group-description "Subnet group for RopaniAI cache" \
  --subnet-ids <subnet-1-id> <subnet-2-id>

# Allow Redis from backend
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 6379 \
  --source-group $BACKEND_SG_ID

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id ropani-redis \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name ropani-cache-subnet-group \
  --security-group-ids $DB_SG_ID

# Wait for creation
aws elasticache wait cache-cluster-available \
  --cache-cluster-id ropani-redis

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id ropani-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text
```

### Qdrant (ECS Fargate)

Create `qdrant-task-definition.json` (see separate file).

```bash
# Register Qdrant task definition
aws ecs register-task-definition \
  --cli-input-json file://qdrant-task-definition.json

# Create Qdrant service
aws ecs create-service \
  --cluster ropani-cluster \
  --service-name ropani-qdrant-service \
  --task-definition ropani-qdrant-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-1-id>],securityGroups=[$BACKEND_SG_ID],assignPublicIp=ENABLED}"

# Get task IP
aws ecs list-tasks \
  --cluster ropani-cluster \
  --service-name ropani-qdrant-service

TASK_ARN=<your-task-arn>

aws ecs describe-tasks \
  --cluster ropani-cluster \
  --tasks $TASK_ARN \
  --query 'tasks[0].containers[0].networkInterfaces[0].privateIpv4Address' \
  --output text
```

---

## 🌐 Frontend Deployment (S3 + CloudFront)

### Step 1: Create S3 Bucket

```bash
# Create S3 bucket (name must be globally unique)
aws s3 mb s3://ropani-frontend-prod --region ap-south-1

# Enable static website hosting
aws s3 website s3://ropani-frontend-prod \
  --index-document index.html \
  --error-document index.html

# Create bucket policy for public read
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::ropani-frontend-prod/*"
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket ropani-frontend-prod \
  --policy file://bucket-policy.json
```

### Step 2: Build Frontend

```bash
# Navigate to frontend folder
cd C:\Users\ACER\OneDrive\Desktop\rag-backend\frontend

# Update API URL in .env.production
echo "VITE_API_URL=http://<alb-dns-name>" > .env.production

# Install dependencies and build
npm install
npm run build
```

### Step 3: Upload to S3

```bash
# Upload build files
aws s3 sync dist/ s3://ropani-frontend-prod/ --delete

# Set cache headers for static assets
aws s3 cp s3://ropani-frontend-prod/assets s3://ropani-frontend-prod/assets \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable"
```

### Step 4: Create CloudFront Distribution

```bash
# Create distribution
aws cloudfront create-distribution \
  --origin-domain-name ropani-frontend-prod.s3-website.ap-south-1.amazonaws.com \
  --default-root-object index.html

# Note: Full CloudFront configuration is complex, see cloudfront-config.json
```

Create `cloudfront-config.json`:
```json
{
  "CallerReference": "ropani-frontend-2025",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-ropani-frontend",
      "DomainName": "ropani-frontend-prod.s3-website.ap-south-1.amazonaws.com",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-ropani-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    }]
  },
  "Comment": "RopaniAI Frontend Distribution",
  "Enabled": true
}
```

Then:
```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### Step 5: Get CloudFront URL

```bash
# List distributions
aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].DomainName' \
  --output text
```

Your frontend will be available at: `https://<distribution-id>.cloudfront.net`

---

## 🔐 Secrets Management

### Step 1: Store Secrets in Secrets Manager

```bash
# Store database password
aws secretsmanager create-secret \
  --name ropani/db/password \
  --secret-string 'YourSecurePassword123!'

# Store Cohere API key
aws secretsmanager create-secret \
  --name ropani/api/cohere \
  --secret-string 'your-cohere-api-key'

# Store HuggingFace API key
aws secretsmanager create-secret \
  --name ropani/api/huggingface \
  --secret-string 'your-hf-api-key'

# Store all connection strings as JSON
aws secretsmanager create-secret \
  --name ropani/config/databases \
  --secret-string '{
    "postgres_url": "postgresql://postgres:PASSWORD@ENDPOINT/rag",
    "mysql_host": "MYSQL_ENDPOINT",
    "mysql_user": "root",
    "mysql_password": "PASSWORD",
    "mysql_database": "ropani_marketplace",
    "redis_host": "REDIS_ENDPOINT",
    "redis_port": "6379",
    "qdrant_url": "http://QDRANT_IP:6333"
  }'
```

### Step 2: Reference in Task Definition

Update `ecs-task-definition.json` to use secrets:
```json
{
  "secrets": [
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:ropani/db/password"
    },
    {
      "name": "COHERE_API_KEY",
      "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:ropani/api/cohere"
    }
  ]
}
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

See `.github/workflows/deploy-aws.yml` (created separately).

Key features:
- ✅ Automatic Docker build on push to `main`
- ✅ Push to ECR
- ✅ Update ECS service
- ✅ Frontend build and S3 sync
- ✅ CloudFront cache invalidation

---

## 📊 Monitoring & Logging

### CloudWatch Setup

```bash
# Create log group for backend
aws logs create-log-group \
  --log-group-name /ecs/ropani-backend

# Set retention to 7 days
aws logs put-retention-policy \
  --log-group-name /ecs/ropani-backend \
  --retention-in-days 7

# Create metric filters for errors
aws logs put-metric-filter \
  --log-group-name /ecs/ropani-backend \
  --filter-name ErrorCount \
  --filter-pattern "[ERROR]" \
  --metric-transformations \
    metricName=BackendErrors,metricNamespace=RopaniAI,metricValue=1

# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name ropani-backend-errors \
  --alarm-description "Alert on high error rate" \
  --metric-name BackendErrors \
  --namespace RopaniAI \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions <SNS_TOPIC_ARN>
```

### CloudWatch Dashboard

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name RopaniAI-Dashboard \
  --dashboard-body file://cloudwatch-dashboard.json
```

---

## 🔒 SSL/HTTPS Setup

### Step 1: Request Certificate (ACM)

```bash
# Request certificate for your domain
aws acm request-certificate \
  --domain-name ropani.yourdomain.com \
  --subject-alternative-names www.ropani.yourdomain.com \
  --validation-method DNS \
  --region us-east-1  # Must be us-east-1 for CloudFront

# Get validation CNAME records
aws acm describe-certificate \
  --certificate-arn <certificate-arn> \
  --region us-east-1
```

### Step 2: Add DNS Records

Add the CNAME validation records to your DNS provider (Route 53, Cloudflare, etc.).

### Step 3: Update ALB Listener

```bash
# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# Redirect HTTP to HTTPS
aws elbv2 modify-listener \
  --listener-arn <http-listener-arn> \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}
```

### Step 4: Update CloudFront

```bash
# Update distribution with custom domain and SSL
aws cloudfront update-distribution \
  --id <distribution-id> \
  --distribution-config file://cloudfront-ssl-config.json
```

---

## ⚡ Scaling & Optimization

### Auto-Scaling for ECS

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/ropani-cluster/ropani-backend-service \
  --min-capacity 1 \
  --max-capacity 4

# CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/ropani-cluster/ropani-backend-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

### Cost Optimization Tips

1. **Use Fargate Spot** (up to 70% savings):
```bash
# Add to task definition:
"capacityProviderStrategy": [
  {
    "capacityProvider": "FARGATE_SPOT",
    "weight": 1
  }
]
```

2. **Reserved Instances** for RDS (save 30-60%)
3. **S3 Intelligent-Tiering** for old uploads
4. **CloudFront compression** enabled
5. **Schedule ECS tasks** for dev/staging (stop at night)

### Performance Optimization

1. **Enable RDS Performance Insights**
2. **Use ElastiCache for session storage**
3. **CloudFront edge caching** for static assets
4. **ECS task CPU/memory** right-sizing
5. **Database connection pooling** (SQLAlchemy pool_size=5)

---

## 🎯 Quick Start Commands

Once everything is set up, deploy updates with:

```bash
# Backend update
docker build -t ropani-backend:latest .
docker tag ropani-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ropani-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ropani-backend:latest
aws ecs update-service --cluster ropani-cluster --service ropani-backend-service --force-new-deployment

# Frontend update
cd frontend
npm run build
aws s3 sync dist/ s3://ropani-frontend-prod/ --delete
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

---

## 🆘 Troubleshooting

### ECS Task Not Starting

```bash
# Check task logs
aws ecs describe-tasks \
  --cluster ropani-cluster \
  --tasks <task-arn>

# View CloudWatch logs
aws logs tail /ecs/ropani-backend --follow
```

### Database Connection Issues

```bash
# Test connectivity from ECS task
aws ecs execute-command \
  --cluster ropani-cluster \
  --task <task-id> \
  --container ropani-backend \
  --interactive \
  --command "/bin/bash"

# Inside container:
nc -zv <db-endpoint> 5432
```

### High Costs

```bash
# Check Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-12 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

---

## 📚 Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [CloudFront Performance Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/performance.html)
- [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.Security.html)
- [AWS Cost Optimization](https://aws.amazon.com/pricing/cost-optimization/)

---

## ✅ Deployment Checklist

- [ ] AWS account configured with CLI
- [ ] VPC and subnets created
- [ ] ECR repository created
- [ ] Docker image built and pushed
- [ ] RDS PostgreSQL database created
- [ ] RDS MySQL database created
- [ ] ElastiCache Redis cluster created
- [ ] Qdrant ECS service running
- [ ] Secrets stored in Secrets Manager
- [ ] ECS task definition registered
- [ ] ECS service created with ALB
- [ ] S3 bucket created for frontend
- [ ] Frontend built and uploaded
- [ ] CloudFront distribution created
- [ ] SSL certificate requested and validated
- [ ] HTTPS configured on ALB and CloudFront
- [ ] Auto-scaling configured
- [ ] CloudWatch alarms set up
- [ ] CI/CD pipeline configured
- [ ] Custom domain configured (optional)
- [ ] Monitoring dashboard created

---

**Next Steps**: See individual configuration files for detailed JSON/YAML definitions.
