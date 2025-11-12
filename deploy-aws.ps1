# AWS Deployment Automation Script for RopaniAI
# Run this script to deploy the entire stack to AWS

param(
    [string]$Region = "ap-south-1",
    [string]$ProjectName = "ropani",
    [switch]$SkipDatabases,
    [switch]$SkipFrontend
)

Write-Host "🚀 RopaniAI AWS Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI not found! Please install it first." -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    $accountId = aws sts get-caller-identity --query Account --output text
    Write-Host "✅ Logged in to AWS Account: $accountId" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to AWS. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Region: $Region"
Write-Host "  Project: $ProjectName"
Write-Host "  Account ID: $accountId"
Write-Host ""

# Variables
$VPC_CIDR = "10.0.0.0/16"
$SUBNET1_CIDR = "10.0.1.0/24"
$SUBNET2_CIDR = "10.0.2.0/24"
$DB_PASSWORD = "RopaniAI$(Get-Random -Minimum 1000 -Maximum 9999)!"

Write-Host "🔐 Generated Database Password: $DB_PASSWORD" -ForegroundColor Yellow
Write-Host "   ⚠️  SAVE THIS PASSWORD! You'll need it later." -ForegroundColor Yellow
Write-Host ""

# Step 1: Create VPC
Write-Host "Step 1: Creating VPC..." -ForegroundColor Green
$vpcId = aws ec2 create-vpc `
    --cidr-block $VPC_CIDR `
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$ProjectName-vpc}]" `
    --query 'Vpc.VpcId' `
    --output text `
    --region $Region

if (-not $vpcId) {
    Write-Host "❌ Failed to create VPC" -ForegroundColor Red
    exit 1
}
Write-Host "✅ VPC created: $vpcId" -ForegroundColor Green

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id $vpcId --enable-dns-hostnames --region $Region
Write-Host ""

# Step 2: Create Internet Gateway
Write-Host "Step 2: Creating Internet Gateway..." -ForegroundColor Green
$igwId = aws ec2 create-internet-gateway `
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$ProjectName-igw}]" `
    --query 'InternetGateway.InternetGatewayId' `
    --output text `
    --region $Region

aws ec2 attach-internet-gateway --vpc-id $vpcId --internet-gateway-id $igwId --region $Region
Write-Host "✅ Internet Gateway created: $igwId" -ForegroundColor Green
Write-Host ""

# Step 3: Create Subnets
Write-Host "Step 3: Creating Subnets..." -ForegroundColor Green
$subnet1Id = aws ec2 create-subnet `
    --vpc-id $vpcId `
    --cidr-block $SUBNET1_CIDR `
    --availability-zone "${Region}a" `
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$ProjectName-subnet-1}]" `
    --query 'Subnet.SubnetId' `
    --output text `
    --region $Region

$subnet2Id = aws ec2 create-subnet `
    --vpc-id $vpcId `
    --cidr-block $SUBNET2_CIDR `
    --availability-zone "${Region}b" `
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$ProjectName-subnet-2}]" `
    --query 'Subnet.SubnetId' `
    --output text `
    --region $Region

# Enable auto-assign public IP
aws ec2 modify-subnet-attribute --subnet-id $subnet1Id --map-public-ip-on-launch --region $Region
aws ec2 modify-subnet-attribute --subnet-id $subnet2Id --map-public-ip-on-launch --region $Region

Write-Host "✅ Subnets created: $subnet1Id, $subnet2Id" -ForegroundColor Green
Write-Host ""

# Step 4: Create Route Table
Write-Host "Step 4: Creating Route Table..." -ForegroundColor Green
$rtbId = aws ec2 create-route-table `
    --vpc-id $vpcId `
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=$ProjectName-rtb}]" `
    --query 'RouteTable.RouteTableId' `
    --output text `
    --region $Region

aws ec2 create-route --route-table-id $rtbId --destination-cidr-block 0.0.0.0/0 --gateway-id $igwId --region $Region
aws ec2 associate-route-table --route-table-id $rtbId --subnet-id $subnet1Id --region $Region
aws ec2 associate-route-table --route-table-id $rtbId --subnet-id $subnet2Id --region $Region
Write-Host "✅ Route table configured" -ForegroundColor Green
Write-Host ""

# Step 5: Create Security Groups
Write-Host "Step 5: Creating Security Groups..." -ForegroundColor Green
$backendSgId = aws ec2 create-security-group `
    --group-name "$ProjectName-backend-sg" `
    --description "Security group for backend" `
    --vpc-id $vpcId `
    --query 'GroupId' `
    --output text `
    --region $Region

$dbSgId = aws ec2 create-security-group `
    --group-name "$ProjectName-db-sg" `
    --description "Security group for databases" `
    --vpc-id $vpcId `
    --query 'GroupId' `
    --output text `
    --region $Region

# Backend SG rules
aws ec2 authorize-security-group-ingress --group-id $backendSgId --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region $Region
aws ec2 authorize-security-group-ingress --group-id $backendSgId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region
aws ec2 authorize-security-group-ingress --group-id $backendSgId --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region

# DB SG rules
aws ec2 authorize-security-group-ingress --group-id $dbSgId --protocol tcp --port 5432 --source-group $backendSgId --region $Region
aws ec2 authorize-security-group-ingress --group-id $dbSgId --protocol tcp --port 3306 --source-group $backendSgId --region $Region
aws ec2 authorize-security-group-ingress --group-id $dbSgId --protocol tcp --port 6379 --source-group $backendSgId --region $Region

Write-Host "✅ Security groups created" -ForegroundColor Green
Write-Host ""

# Step 6: Create ECR Repository
Write-Host "Step 6: Creating ECR Repository..." -ForegroundColor Green
try {
    $ecrUri = aws ecr create-repository `
        --repository-name "$ProjectName-backend" `
        --region $Region `
        --query 'repository.repositoryUri' `
        --output text
    Write-Host "✅ ECR Repository created: $ecrUri" -ForegroundColor Green
} catch {
    $ecrUri = aws ecr describe-repositories `
        --repository-names "$ProjectName-backend" `
        --region $Region `
        --query 'repositories[0].repositoryUri' `
        --output text
    Write-Host "✅ ECR Repository already exists: $ecrUri" -ForegroundColor Green
}
Write-Host ""

# Step 7: Build and Push Docker Image
Write-Host "Step 7: Building and pushing Docker image..." -ForegroundColor Green
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Yellow

# ECR Login
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$accountId.dkr.ecr.$Region.amazonaws.com"

# Build
docker build -t "$ProjectName-backend:latest" .
docker tag "$ProjectName-backend:latest" "$ecrUri:latest"

# Push
docker push "$ecrUri:latest"
Write-Host "✅ Docker image pushed to ECR" -ForegroundColor Green
Write-Host ""

if (-not $SkipDatabases) {
    # Step 8: Create RDS Subnet Group
    Write-Host "Step 8: Creating RDS Subnet Group..." -ForegroundColor Green
    aws rds create-db-subnet-group `
        --db-subnet-group-name "$ProjectName-db-subnet-group" `
        --db-subnet-group-description "Subnet group for databases" `
        --subnet-ids $subnet1Id $subnet2Id `
        --region $Region
    Write-Host "✅ RDS Subnet Group created" -ForegroundColor Green
    Write-Host ""

    # Step 9: Create PostgreSQL
    Write-Host "Step 9: Creating PostgreSQL Database..." -ForegroundColor Green
    Write-Host "   This may take 10-15 minutes..." -ForegroundColor Yellow
    aws rds create-db-instance `
        --db-instance-identifier "$ProjectName-postgres" `
        --db-instance-class db.t4g.micro `
        --engine postgres `
        --engine-version 15.4 `
        --master-username postgres `
        --master-user-password $DB_PASSWORD `
        --allocated-storage 20 `
        --vpc-security-group-ids $dbSgId `
        --db-subnet-group-name "$ProjectName-db-subnet-group" `
        --backup-retention-period 7 `
        --no-publicly-accessible `
        --region $Region

    # Step 10: Create MySQL
    Write-Host "Step 10: Creating MySQL Database..." -ForegroundColor Green
    aws rds create-db-instance `
        --db-instance-identifier "$ProjectName-mysql" `
        --db-instance-class db.t4g.micro `
        --engine mysql `
        --engine-version 8.0.35 `
        --master-username root `
        --master-user-password $DB_PASSWORD `
        --allocated-storage 20 `
        --vpc-security-group-ids $dbSgId `
        --db-subnet-group-name "$ProjectName-db-subnet-group" `
        --backup-retention-period 7 `
        --no-publicly-accessible `
        --region $Region

    Write-Host "✅ Database creation initiated" -ForegroundColor Green
    Write-Host "   ⏳ Waiting for databases to be available (this will take 10-15 minutes)..." -ForegroundColor Yellow
    
    # Wait for PostgreSQL
    aws rds wait db-instance-available --db-instance-identifier "$ProjectName-postgres" --region $Region
    $postgresEndpoint = aws rds describe-db-instances `
        --db-instance-identifier "$ProjectName-postgres" `
        --query 'DBInstances[0].Endpoint.Address' `
        --output text `
        --region $Region
    Write-Host "✅ PostgreSQL ready: $postgresEndpoint" -ForegroundColor Green

    # Wait for MySQL
    aws rds wait db-instance-available --db-instance-identifier "$ProjectName-mysql" --region $Region
    $mysqlEndpoint = aws rds describe-db-instances `
        --db-instance-identifier "$ProjectName-mysql" `
        --query 'DBInstances[0].Endpoint.Address' `
        --output text `
        --region $Region
    Write-Host "✅ MySQL ready: $mysqlEndpoint" -ForegroundColor Green
    Write-Host ""

    # Step 11: Create ElastiCache Subnet Group
    Write-Host "Step 11: Creating ElastiCache..." -ForegroundColor Green
    aws elasticache create-cache-subnet-group `
        --cache-subnet-group-name "$ProjectName-cache-subnet-group" `
        --cache-subnet-group-description "Subnet group for cache" `
        --subnet-ids $subnet1Id $subnet2Id `
        --region $Region

    aws elasticache create-cache-cluster `
        --cache-cluster-id "$ProjectName-redis" `
        --cache-node-type cache.t4g.micro `
        --engine redis `
        --engine-version 7.0 `
        --num-cache-nodes 1 `
        --cache-subnet-group-name "$ProjectName-cache-subnet-group" `
        --security-group-ids $dbSgId `
        --region $Region

    aws elasticache wait cache-cluster-available --cache-cluster-id "$ProjectName-redis" --region $Region
    $redisEndpoint = aws elasticache describe-cache-clusters `
        --cache-cluster-id "$ProjectName-redis" `
        --show-cache-node-info `
        --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' `
        --output text `
        --region $Region
    Write-Host "✅ Redis ready: $redisEndpoint" -ForegroundColor Green
    Write-Host ""
}

# Step 12: Create ECS Cluster
Write-Host "Step 12: Creating ECS Cluster..." -ForegroundColor Green
aws ecs create-cluster --cluster-name "$ProjectName-cluster" --region $Region
Write-Host "✅ ECS Cluster created" -ForegroundColor Green
Write-Host ""

# Step 13: Create CloudWatch Log Group
Write-Host "Step 13: Creating CloudWatch Log Groups..." -ForegroundColor Green
aws logs create-log-group --log-group-name "/ecs/$ProjectName-backend" --region $Region
aws logs put-retention-policy --log-group-name "/ecs/$ProjectName-backend" --retention-in-days 7 --region $Region
Write-Host "✅ Log groups created" -ForegroundColor Green
Write-Host ""

# Step 14: Create IAM Role
Write-Host "Step 14: Creating IAM Execution Role..." -ForegroundColor Green
$roleExists = aws iam get-role --role-name ecsTaskExecutionRole 2>$null
if (-not $roleExists) {
    aws iam create-role `
        --role-name ecsTaskExecutionRole `
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }'
    
    aws iam attach-role-policy `
        --role-name ecsTaskExecutionRole `
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    Write-Host "✅ IAM Role created" -ForegroundColor Green
} else {
    Write-Host "✅ IAM Role already exists" -ForegroundColor Green
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ AWS Infrastructure Created!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Save these details:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Infrastructure IDs:" -ForegroundColor White
Write-Host "  VPC ID: $vpcId" -ForegroundColor White
Write-Host "  Subnet 1: $subnet1Id" -ForegroundColor White
Write-Host "  Subnet 2: $subnet2Id" -ForegroundColor White
Write-Host "  Backend SG: $backendSgId" -ForegroundColor White
Write-Host "  Database SG: $dbSgId" -ForegroundColor White
Write-Host ""

if (-not $SkipDatabases) {
    Write-Host "Database Endpoints:" -ForegroundColor White
    Write-Host "  PostgreSQL: $postgresEndpoint" -ForegroundColor White
    Write-Host "  MySQL: $mysqlEndpoint" -ForegroundColor White
    Write-Host "  Redis: $redisEndpoint" -ForegroundColor White
    Write-Host "  Password: $DB_PASSWORD" -ForegroundColor White
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update ecs-task-definition.json with:" -ForegroundColor White
Write-Host "   - Account ID: $accountId" -ForegroundColor White
Write-Host "   - ECR Image: $ecrUri" -ForegroundColor White
if (-not $SkipDatabases) {
    Write-Host "   - Database endpoints from above" -ForegroundColor White
}
Write-Host "2. Run: aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json" -ForegroundColor White
Write-Host "3. Create Application Load Balancer and ECS Service (see AWS-DEPLOYMENT.md)" -ForegroundColor White
if (-not $SkipFrontend) {
    Write-Host "4. Deploy frontend to S3 + CloudFront (see AWS-DEPLOYMENT.md)" -ForegroundColor White
}
Write-Host ""
Write-Host "✅ Deployment script completed!" -ForegroundColor Green
