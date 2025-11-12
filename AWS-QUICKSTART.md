# 🚀 AWS Quick Start Guide

This is a simplified guide to get your RopaniAI project deployed to AWS in **under 30 minutes** (excluding database creation time).

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker Desktop running
- [ ] Git repository pushed to GitHub (for CI/CD)
- [ ] API keys ready: `COHERE_API_KEY`, `HF_API_KEY`

## Quick Deploy (Automated)

### Option 1: Full Automated Deployment

```powershell
# Run the automated deployment script
.\deploy-aws.ps1 -Region ap-south-1

# Script will create:
# ✅ VPC, subnets, security groups
# ✅ ECR repository
# ✅ Docker image build & push
# ✅ RDS PostgreSQL & MySQL
# ✅ ElastiCache Redis
# ✅ ECS Cluster
# ✅ CloudWatch logs

# Time: ~20 minutes (databases take longest)
```

**SAVE THE OUTPUT!** The script generates a database password and displays all endpoints.

### Option 2: Skip Databases (Faster Testing)

```powershell
# Skip database creation for faster testing
.\deploy-aws.ps1 -Region ap-south-1 -SkipDatabases

# You can add databases later
# Time: ~5 minutes
```

## Manual Steps After Script

### 1. Update Task Definition

Edit `ecs-task-definition.json`:
- Replace `ACCOUNT_ID` with your AWS account ID (shown in script output)
- Update database endpoints from script output

```powershell
# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### 2. Create Application Load Balancer

```powershell
# Get subnet IDs from script output
$SUBNET1="subnet-xxxxx"
$SUBNET2="subnet-yyyyy"
$BACKEND_SG="sg-zzzzz"

# Create ALB
aws elbv2 create-load-balancer `
  --name ropani-alb `
  --subnets $SUBNET1 $SUBNET2 `
  --security-groups $BACKEND_SG `
  --scheme internet-facing

# Save the LoadBalancerArn from output
$ALB_ARN="arn:aws:elasticloadbalancing:..."

# Create target group
aws elbv2 create-target-group `
  --name ropani-backend-tg `
  --protocol HTTP `
  --port 8000 `
  --vpc-id vpc-xxxxx `
  --target-type ip `
  --health-check-path /docs

# Save the TargetGroupArn
$TG_ARN="arn:aws:elasticloadbalancing:..."

# Create listener
aws elbv2 create-listener `
  --load-balancer-arn $ALB_ARN `
  --protocol HTTP `
  --port 80 `
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### 3. Create ECS Service

```powershell
aws ecs create-service `
  --cluster ropani-cluster `
  --service-name ropani-backend-service `
  --task-definition ropani-backend-task `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1,$SUBNET2],securityGroups=[$BACKEND_SG],assignPublicIp=ENABLED}" `
  --load-balancers "targetGroupArn=$TG_ARN,containerName=ropani-backend,containerPort=8000"
```

### 4. Get Backend URL

```powershell
# Get ALB DNS name
aws elbv2 describe-load-balancers `
  --load-balancer-arns $ALB_ARN `
  --query 'LoadBalancers[0].DNSName' `
  --output text

# Your backend is at: http://<alb-dns-name>
# Test it: http://<alb-dns-name>/docs
```

### 5. Deploy Frontend

```powershell
# Create S3 bucket
aws s3 mb s3://ropani-frontend-prod

# Enable static website hosting
aws s3 website s3://ropani-frontend-prod `
  --index-document index.html `
  --error-document index.html

# Build frontend
cd frontend
echo "VITE_API_URL=http://<alb-dns-name>" > .env.production
npm install
npm run build

# Upload to S3
aws s3 sync dist/ s3://ropani-frontend-prod/ --delete

# Make public
aws s3api put-bucket-policy `
  --bucket ropani-frontend-prod `
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ropani-frontend-prod/*"
    }]
  }'

# Get website URL
echo "http://ropani-frontend-prod.s3-website.ap-south-1.amazonaws.com"
```

### 6. Create CloudFront (Optional but Recommended)

```powershell
# Update cloudfront-config.json with your S3 website domain
# Then create distribution
aws cloudfront create-distribution `
  --distribution-config file://cloudfront-config.json

# Get CloudFront URL
aws cloudfront list-distributions `
  --query 'DistributionList.Items[0].DomainName' `
  --output text

# Your frontend is at: https://<distribution-id>.cloudfront.net
```

## Verify Deployment

### Backend Health Check
```powershell
# Should return 200 OK
curl http://<alb-dns-name>/docs
```

### Frontend Access
```powershell
# Open in browser
start http://ropani-frontend-prod.s3-website.ap-south-1.amazonaws.com
```

### Database Connectivity
```powershell
# Connect to PostgreSQL
psql -h <postgres-endpoint> -U postgres -d postgres

# Connect to MySQL
mysql -h <mysql-endpoint> -u root -p
```

## Setup CI/CD (Optional)

### 1. Add GitHub Secrets

Go to: `https://github.com/karkishubha/RopaniAI_ProjectII/settings/secrets/actions`

Add these secrets:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `CLOUDFRONT_DISTRIBUTION_ID`: From CloudFront creation

### 2. Enable Workflow

The workflow file is already created at `.github/workflows/deploy-aws.yml`

Push to `main` branch to trigger auto-deployment!

## Cost Monitoring

### Check Current Costs
```powershell
# Get cost for current month
aws ce get-cost-and-usage `
  --time-period Start=2025-11-01,End=2025-11-30 `
  --granularity MONTHLY `
  --metrics BlendedCost `
  --group-by Type=SERVICE
```

### Set Budget Alert
```powershell
# Create $100/month budget
aws budgets create-budget `
  --account-id <your-account-id> `
  --budget '{
    "BudgetName": "RopaniAI-Monthly-Budget",
    "BudgetLimit": {
      "Amount": "100",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

## Scaling for Production

### Enable Auto-Scaling
```powershell
# Scale between 1-4 tasks based on CPU
aws application-autoscaling register-scalable-target `
  --service-namespace ecs `
  --scalable-dimension ecs:service:DesiredCount `
  --resource-id service/ropani-cluster/ropani-backend-service `
  --min-capacity 1 `
  --max-capacity 4

aws application-autoscaling put-scaling-policy `
  --service-namespace ecs `
  --scalable-dimension ecs:service:DesiredCount `
  --resource-id service/ropani-cluster/ropani-backend-service `
  --policy-name cpu-scaling `
  --policy-type TargetTrackingScaling `
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

### Enable Multi-AZ for Databases
```powershell
# Modify RDS for high availability
aws rds modify-db-instance `
  --db-instance-identifier ropani-postgres `
  --multi-az `
  --apply-immediately
```

## Troubleshooting

### ECS Task Failing
```powershell
# Check task logs
aws logs tail /ecs/ropani-backend --follow

# Describe stopped tasks
aws ecs describe-tasks `
  --cluster ropani-cluster `
  --tasks <task-arn>
```

### Database Connection Failed
```powershell
# Check security group rules
aws ec2 describe-security-groups `
  --group-ids <db-sg-id>

# Ensure backend SG is allowed
```

### High Costs
```powershell
# Stop non-prod resources at night
aws ecs update-service `
  --cluster ropani-cluster `
  --service ropani-backend-service `
  --desired-count 0

# Restart in morning
aws ecs update-service `
  --cluster ropani-cluster `
  --service ropani-backend-service `
  --desired-count 1
```

## Update Deployment

### Backend Update
```powershell
# Build new image
docker build -t ropani-backend:latest .

# Push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com
docker tag ropani-backend:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ropani-backend:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ropani-backend:latest

# Force new deployment
aws ecs update-service `
  --cluster ropani-cluster `
  --service ropani-backend-service `
  --force-new-deployment
```

### Frontend Update
```powershell
cd frontend
npm run build
aws s3 sync dist/ s3://ropani-frontend-prod/ --delete

# If using CloudFront
aws cloudfront create-invalidation `
  --distribution-id <distribution-id> `
  --paths "/*"
```

## Cleanup (Delete Everything)

```powershell
# WARNING: This deletes all resources!

# Delete ECS service
aws ecs delete-service --cluster ropani-cluster --service ropani-backend-service --force

# Delete ECS cluster
aws ecs delete-cluster --cluster ropani-cluster

# Delete databases
aws rds delete-db-instance --db-instance-identifier ropani-postgres --skip-final-snapshot
aws rds delete-db-instance --db-instance-identifier ropani-mysql --skip-final-snapshot
aws elasticache delete-cache-cluster --cache-cluster-id ropani-redis

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn <alb-arn>
aws elbv2 delete-target-group --target-group-arn <tg-arn>

# Empty and delete S3 bucket
aws s3 rm s3://ropani-frontend-prod/ --recursive
aws s3 rb s3://ropani-frontend-prod

# Delete CloudFront distribution (must disable first)
aws cloudfront update-distribution --id <dist-id> --distribution-config <config-with-enabled-false>
aws cloudfront delete-distribution --id <dist-id> --if-match <etag>

# Delete ECR repository
aws ecr delete-repository --repository-name ropani-backend --force

# Delete VPC (last)
# Delete in order: NAT, IGW, subnets, route tables, security groups, VPC
```

## Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com
- **AWS Free Tier**: https://aws.amazon.com/free
- **Cost Calculator**: https://calculator.aws
- **AWS Support**: https://console.aws.amazon.com/support

## Next Steps

1. ✅ Set up custom domain with Route 53
2. ✅ Configure SSL certificates with ACM
3. ✅ Enable CloudWatch alarms
4. ✅ Set up automated backups
5. ✅ Configure WAF for security
6. ✅ Enable AWS Shield for DDoS protection

---

**Estimated Total Time**: 30-45 minutes for full deployment

**Estimated Monthly Cost**: $113 (production) or ~$50 (free tier eligible)
