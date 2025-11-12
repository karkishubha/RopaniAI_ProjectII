# RopaniAI AWS Deployment - Environment Variables

This file contains all environment variables needed for AWS deployment.

## Backend Environment Variables (ECS Task Definition)

### Database Configuration
```bash
# PostgreSQL (RDS)
DB_URL=postgresql://postgres:PASSWORD@ropani-postgres.xxxxx.ap-south-1.rds.amazonaws.com/rag

# MySQL (RDS)
MYSQL_HOST=ropani-mysql.xxxxx.ap-south-1.rds.amazonaws.com
MYSQL_USER=root
MYSQL_PASSWORD=<your-db-password>
MYSQL_DATABASE=ropani_marketplace

# Redis (ElastiCache)
REDIS_HOST=ropani-redis.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for ElastiCache without auth

# Qdrant (ECS Fargate)
QDRANT_URL=http://10.0.x.x:6333  # Private IP of Qdrant ECS task
```

### AI/ML API Keys
```bash
# Cohere API
COHERE_API_KEY=your-cohere-api-key-here
USE_COHERE=true

# HuggingFace API (fallback)
HF_API_KEY=your-huggingface-api-key-here
```

## Frontend Environment Variables (.env.production)

```bash
# Backend API URL (ALB DNS)
VITE_API_URL=http://ropani-alb-xxxxx.ap-south-1.elb.amazonaws.com

# Or with HTTPS after SSL setup
VITE_API_URL=https://api.ropani.yourdomain.com
```

## AWS Secrets Manager Setup

### Create Secrets

```powershell
# Database password
aws secretsmanager create-secret `
  --name ropani/db/password `
  --secret-string 'YourSecurePassword123!' `
  --region ap-south-1

# Cohere API key
aws secretsmanager create-secret `
  --name ropani/api/cohere `
  --secret-string 'your-cohere-api-key' `
  --region ap-south-1

# HuggingFace API key
aws secretsmanager create-secret `
  --name ropani/api/huggingface `
  --secret-string 'your-hf-api-key' `
  --region ap-south-1

# All database configs (recommended approach)
aws secretsmanager create-secret `
  --name ropani/config/databases `
  --secret-string '{
    "postgres_url": "postgresql://postgres:PASSWORD@ENDPOINT/rag",
    "mysql_host": "ropani-mysql.xxxxx.ap-south-1.rds.amazonaws.com",
    "mysql_user": "root",
    "mysql_password": "YourSecurePassword123!",
    "mysql_database": "ropani_marketplace",
    "redis_host": "ropani-redis.xxxxx.cache.amazonaws.com",
    "redis_port": "6379",
    "qdrant_url": "http://10.0.x.x:6333"
  }' `
  --region ap-south-1
```

### Reference in ECS Task Definition

Update `ecs-task-definition.json`:

```json
{
  "secrets": [
    {
      "name": "DB_URL",
      "valueFrom": "arn:aws:secretsmanager:ap-south-1:123456789012:secret:ropani/config/databases:postgres_url::"
    },
    {
      "name": "MYSQL_HOST",
      "valueFrom": "arn:aws:secretsmanager:ap-south-1:123456789012:secret:ropani/config/databases:mysql_host::"
    },
    {
      "name": "COHERE_API_KEY",
      "valueFrom": "arn:aws:secretsmanager:ap-south-1:123456789012:secret:ropani/api/cohere"
    }
  ]
}
```

## GitHub Secrets (for CI/CD)

Add these to: `https://github.com/karkishubha/RopaniAI_ProjectII/settings/secrets/actions`

```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
COHERE_API_KEY=your-cohere-key
HF_API_KEY=your-hf-key
```

## Environment-Specific Variables

### Development
```bash
# Local development
DB_URL=postgresql://postgres:password@localhost:5432/rag
MYSQL_HOST=localhost
REDIS_HOST=localhost
QDRANT_URL=http://localhost:6333
```

### Staging (AWS)
```bash
# AWS staging environment
DB_URL=postgresql://postgres:PASSWORD@ropani-staging-postgres.xxxxx.rds.amazonaws.com/rag
# ... other staging endpoints
```

### Production (AWS)
```bash
# AWS production environment
DB_URL=postgresql://postgres:PASSWORD@ropani-prod-postgres.xxxxx.rds.amazonaws.com/rag
# ... other production endpoints
```

## Security Best Practices

1. **Never commit secrets** to Git
   - Add `.env*` to `.gitignore`
   - Use Secrets Manager for production

2. **Use IAM roles** instead of access keys when possible
   - ECS tasks should use task execution role
   - Lambda functions should use function role

3. **Rotate secrets regularly**
   ```powershell
   # Enable automatic rotation (30 days)
   aws secretsmanager rotate-secret `
     --secret-id ropani/db/password `
     --rotation-rules AutomaticallyAfterDays=30
   ```

4. **Use least privilege** IAM policies
   - Grant only required permissions
   - Separate dev/prod access

5. **Enable secret encryption**
   - Secrets Manager uses AWS KMS by default
   - Use customer-managed CMK for more control

## Retrieving Secrets Programmatically

### Python (in backend)
```python
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='ap-south-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# Usage
db_config = get_secret('ropani/config/databases')
postgres_url = db_config['postgres_url']
```

### AWS CLI
```powershell
# Get single secret
aws secretsmanager get-secret-value `
  --secret-id ropani/api/cohere `
  --query SecretString `
  --output text

# Get JSON secret
aws secretsmanager get-secret-value `
  --secret-id ropani/config/databases `
  --query SecretString `
  --output text | ConvertFrom-Json
```

## Update Secrets

```powershell
# Update existing secret
aws secretsmanager update-secret `
  --secret-id ropani/api/cohere `
  --secret-string 'new-api-key'

# Update JSON secret
aws secretsmanager update-secret `
  --secret-id ropani/config/databases `
  --secret-string '{
    "postgres_url": "new-connection-string",
    ...
  }'
```

## Cost Optimization

- **Secrets Manager**: $0.40/secret/month + $0.05/10,000 API calls
- **Parameter Store**: Free for standard parameters, $0.05/advanced parameter/month
- **Tip**: Use Parameter Store for non-sensitive configs, Secrets Manager for credentials

## Example: Complete ECS Environment

```json
{
  "environment": [
    {"name": "USE_COHERE", "value": "true"},
    {"name": "REDIS_PORT", "value": "6379"},
    {"name": "LOG_LEVEL", "value": "INFO"}
  ],
  "secrets": [
    {"name": "DB_URL", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/config/databases:postgres_url::"},
    {"name": "MYSQL_HOST", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/config/databases:mysql_host::"},
    {"name": "MYSQL_USER", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/config/databases:mysql_user::"},
    {"name": "MYSQL_PASSWORD", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/config/databases:mysql_password::"},
    {"name": "MYSQL_DATABASE", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/config/databases:mysql_database::"},
    {"name": "REDIS_HOST", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/config/databases:redis_host::"},
    {"name": "QDRANT_URL", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/config/databases:qdrant_url::"},
    {"name": "COHERE_API_KEY", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/api/cohere"},
    {"name": "HF_API_KEY", "valueFrom": "arn:aws:secretsmanager:ap-south-1:ACCOUNT:secret:ropani/api/huggingface"}
  ]
}
```

---

**Note**: Replace all placeholder values (ACCOUNT, xxxxx, passwords) with your actual values before deployment.
