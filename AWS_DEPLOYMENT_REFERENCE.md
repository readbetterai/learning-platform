# AWS Deployment Reference Guide
## English Learning Platform - AWS Infrastructure

**Purpose**: Complete reference for migrating from Railway to AWS when scaling beyond 1000 students

**When to Use This Guide**:
- Monthly Railway bill exceeds $80
- Active student count exceeds 1000
- Database size exceeds 30GB
- Need multi-region deployment
- Require advanced compliance (HIPAA, SOC 2)

**Before You Start**: This guide assumes you're already running on Railway and are ready to migrate to AWS for cost optimization and advanced features.

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Service Selection](#service-selection)
3. [AWS App Runner Deployment](#aws-app-runner-deployment-recommended)
4. [Infrastructure as Code](#infrastructure-as-code)
5. [Migration Guide from Railway](#migration-guide-from-railway)
6. [Cost Comparison](#cost-comparison)
7. [Complexity Comparison](#complexity-comparison)
8. [Alternative AWS Architectures](#alternative-aws-architectures)

---

## EXECUTIVE SUMMARY

### Why AWS?

**Cost Optimization at Scale**:
- Railway @ 1000 students: ~$76/month
- AWS @ 1000 students: ~$32/month
- **Annual savings**: ~$528/year

**Advanced Features**:
- Multi-region deployment (global latency <100ms)
- Auto-scaling (0 to 10K+ requests/sec)
- Managed services (RDS, S3, Lambda, CloudWatch)
- Enterprise compliance (HIPAA, SOC 2, ISO 27001)
- Advanced monitoring (X-Ray, CloudWatch Insights)

**When NOT to Use AWS**:
- Student count < 500 (Railway is simpler and cheaper)
- Monthly bill < $60 (overhead not worth it)
- Team lacks AWS experience (4-8 hour learning curve)
- Rapid prototyping phase (Railway faster to iterate)

### Recommended AWS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌─────────────────┐    ┌──────────────┐ │
│  │   Route 53   │──────│   App Runner    │────│     RDS      │ │
│  │     DNS      │      │  (Auto-scaling) │    │ PostgreSQL   │ │
│  └──────────────┘      └─────────────────┘    └──────────────┘ │
│                                │                                 │
│                                │                                 │
│                        ┌───────┴───────┐                        │
│                        │               │                        │
│                   ┌────▼────┐    ┌────▼────┐                   │
│                   │    S3   │    │ Lambda  │                   │
│                   │ Storage │    │  Cron   │                   │
│                   └─────────┘    └─────────┘                   │
│                                       │                         │
│                                ┌──────▼──────┐                 │
│                                │ EventBridge │                 │
│                                │  Scheduler  │                 │
│                                └─────────────┘                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CloudWatch (Logs + Metrics + Alarms)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Services**:
1. **App Runner**: Managed container service (recommended for simplicity)
2. **RDS**: PostgreSQL database (managed, auto-backup, auto-scaling)
3. **S3 or Cloudflare R2**: File storage (essays, feedback)
4. **EventBridge + Lambda**: Cron jobs for homework assignment
5. **CloudWatch**: Logging, metrics, alarms
6. **Route 53**: DNS management (optional, can use existing provider)
7. **Parameter Store**: Secrets management (JWT keys, DB passwords)

---

## SERVICE SELECTION

### Decision Matrix: Which AWS Compute Service?

| Service | Best For | Setup Time | Monthly Cost | Complexity | Auto-Scaling |
|---------|----------|------------|--------------|------------|--------------|
| **App Runner** ⭐ | **Production (Recommended)** | **4 hours** | **$20-30** | **Low** | ✅ Built-in |
| Elastic Beanstalk | Traditional deployments | 8 hours | $30-45 | Medium | ✅ Manual config |
| ECS Fargate | Microservices | 12 hours | $25-40 | High | ✅ Advanced |
| Lambda + API Gateway | Serverless only | 6 hours | $15-25 | Medium | ✅ Automatic |
| EC2 + Load Balancer | Full control | 16 hours | $40-60 | Very High | ❌ Manual |
| Lightsail | Simple apps | 2 hours | $20-30 | Very Low | ❌ Manual |

**Recommendation**: **AWS App Runner**
- Simplest managed container service
- Auto-scaling based on traffic (0.5 to 25 vCPU)
- No infrastructure management (no VPC, subnets, load balancers)
- Pay-per-use (scales to zero during downtime)
- Perfect for NestJS REST APIs

**Why NOT Elastic Beanstalk?**
- More complex (requires understanding of EC2, ALB, Auto Scaling Groups)
- Higher cost (always-on EC2 instances)
- Overkill for stateless REST APIs

**Why NOT ECS Fargate?**
- Requires VPC configuration (subnets, security groups)
- More complex service definitions (task definitions, services, clusters)
- Better for microservices architecture (we have a monolith)

**Why NOT Lambda?**
- Cold start latency (1-3 seconds for first request)
- 15-minute timeout (not ideal for long-running requests)
- Requires API Gateway setup (extra complexity)
- Better for event-driven workloads

---

## AWS APP RUNNER DEPLOYMENT (RECOMMENDED)

### Prerequisites

- AWS Account with billing enabled
- AWS CLI installed (`brew install awscli` or `choco install awscli`)
- Docker installed
- GitHub repository with code

### Phase 1: AWS Account Setup (30 minutes)

#### Step 1: Create AWS Account

1. Visit https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email, password, account name
4. Add credit card (required, but free tier available)
5. Verify phone number
6. Choose "Basic Support" (free)
7. Complete account setup

#### Step 2: Install and Configure AWS CLI

```bash
# Install AWS CLI (macOS)
brew install awscli

# Install AWS CLI (Windows)
choco install awscli

# Install AWS CLI (Linux)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure

# Enter your credentials:
AWS Access Key ID: <from AWS Console>
AWS Secret Access Key: <from AWS Console>
Default region name: us-east-1
Default output format: json
```

**How to Get AWS Access Keys**:
1. AWS Console → IAM → Users → Create User
2. User name: `learning-platform-deploy`
3. Attach policies: `AdministratorAccess` (for initial setup)
4. Security credentials → Create access key
5. Use case: "CLI"
6. Download credentials (shown only once!)

---

### Phase 2: IAM Roles and Policies (45 minutes)

AWS requires explicit IAM roles for services to access other AWS resources.

#### IAM Role 1: App Runner Instance Role

**Purpose**: Allow App Runner containers to access RDS, S3, Parameter Store

**Create Role**:

```bash
# Create trust policy for App Runner
cat > trust-policy-apprunner.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name LearningPlatformAppRunnerRole \
  --assume-role-policy-document file://trust-policy-apprunner.json
```

**Attach Permissions**:

```bash
# Create inline policy for RDS, S3, Parameter Store access
cat > apprunner-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters",
        "rds:Connect"
      ],
      "Resource": "arn:aws:rds:*:*:db:learning-platform-db"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::english-learning-files",
        "arn:aws:s3:::english-learning-files/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/learning-platform/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/apprunner/*"
    }
  ]
}
EOF

# Attach policy to role
aws iam put-role-policy \
  --role-name LearningPlatformAppRunnerRole \
  --policy-name AppRunnerAccessPolicy \
  --policy-document file://apprunner-policy.json
```

#### IAM Role 2: Lambda Cron Role

**Purpose**: Allow Lambda functions to execute cron jobs (homework assignment)

```bash
# Create trust policy for Lambda
cat > trust-policy-lambda.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name LearningPlatformLambdaCronRole \
  --assume-role-policy-document file://trust-policy-lambda.json

# Attach basic Lambda execution policy (CloudWatch Logs)
aws iam attach-role-policy \
  --role-name LearningPlatformLambdaCronRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for cron Lambda (access to RDS via HTTP)
cat > lambda-cron-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/learning-platform/CRON_SECRET"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name LearningPlatformLambdaCronRole \
  --policy-name LambdaCronPolicy \
  --policy-document file://lambda-cron-policy.json
```

---

### Phase 3: RDS PostgreSQL Setup (60 minutes)

#### Step 1: Create RDS PostgreSQL Instance

```bash
# Create database subnet group (required for RDS in VPC)
aws rds create-db-subnet-group \
  --db-subnet-group-name learning-platform-subnet-group \
  --db-subnet-group-description "Subnet group for learning platform" \
  --subnet-ids subnet-12345678 subnet-87654321 \
  # Note: Replace with your VPC's subnet IDs (get from VPC console)

# Create security group for RDS
aws ec2 create-security-group \
  --group-name learning-platform-db-sg \
  --description "Security group for learning platform database" \
  --vpc-id vpc-12345678
  # Note: Replace with your VPC ID

# Allow inbound PostgreSQL traffic from App Runner
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16
  # Note: Replace with your VPC CIDR block

# Create RDS instance (db.t4g.micro - Free tier eligible Year 1)
aws rds create-db-instance \
  --db-instance-identifier learning-platform-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password "CHANGE_THIS_SECURE_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --db-subnet-group-name learning-platform-subnet-group \
  --vpc-security-group-ids sg-12345678 \
  --publicly-accessible false \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --auto-minor-version-upgrade true \
  --deletion-protection true
```

**Wait for RDS to be ready** (10-15 minutes):

```bash
# Check status
aws rds describe-db-instances \
  --db-instance-identifier learning-platform-db \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text

# Wait until status is "available"
aws rds wait db-instance-available \
  --db-instance-identifier learning-platform-db
```

#### Step 2: Get Database Endpoint

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier learning-platform-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Example output:
# learning-platform-db.c9akpkqcz2yz.us-east-1.rds.amazonaws.com
```

#### Step 3: Store Database URL in Parameter Store

```bash
# Create DATABASE_URL parameter
aws ssm put-parameter \
  --name "/learning-platform/DATABASE_URL" \
  --type "SecureString" \
  --value "postgresql://postgres:CHANGE_THIS_PASSWORD@learning-platform-db.c9akpkqcz2yz.us-east-1.rds.amazonaws.com:5432/learning_platform"

# Create other secrets
aws ssm put-parameter \
  --name "/learning-platform/JWT_SECRET" \
  --type "SecureString" \
  --value "$(openssl rand -base64 32)"

aws ssm put-parameter \
  --name "/learning-platform/JWT_REFRESH_SECRET" \
  --type "SecureString" \
  --value "$(openssl rand -base64 32)"

aws ssm put-parameter \
  --name "/learning-platform/CRON_SECRET" \
  --type "SecureString" \
  --value "$(openssl rand -base64 32)"
```

**RDS Cost Optimization Tips**:
- Use `db.t4g.micro` (FREE Year 1, $12/month Year 2+)
- Enable auto-scaling for storage (20GB → 100GB as needed)
- Set max connections to 25 (default 100 wastes memory)
- Enable automated backups (7-day retention)
- Use Multi-AZ only in production (doubles cost)

---

### Phase 4: S3 Storage Setup (30 minutes)

**Note**: You can continue using Cloudflare R2 (FREE) instead of S3. Skip this section if staying with R2.

#### Create S3 Bucket

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket english-learning-files \
  --region us-east-1

# Enable versioning (optional, for file recovery)
aws s3api put-bucket-versioning \
  --bucket english-learning-files \
  --versioning-configuration Status=Enabled

# Enable encryption at rest
aws s3api put-bucket-encryption \
  --bucket english-learning-files \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Configure CORS (allow frontend uploads)
cat > cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket english-learning-files \
  --cors-configuration file://cors-config.json

# Block public access (only pre-signed URLs allowed)
aws s3api put-public-access-block \
  --bucket english-learning-files \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### Configure Lifecycle Policy (Cost Savings)

```bash
# Move old files to cheaper storage after 90 days
cat > lifecycle-policy.json <<EOF
{
  "Rules": [
    {
      "Id": "MoveToInfrequentAccess",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        }
      ],
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket english-learning-files \
  --lifecycle-configuration file://lifecycle-policy.json
```

**Update Environment Variables** (if switching from R2 to S3):

```bash
# Update Parameter Store
aws ssm put-parameter \
  --name "/learning-platform/S3_BUCKET_NAME" \
  --type "String" \
  --value "english-learning-files"

aws ssm put-parameter \
  --name "/learning-platform/AWS_REGION" \
  --type "String" \
  --value "us-east-1"
```

**NestJS Code Changes** (if switching from R2 to S3):

```typescript
// src/storage/storage.service.ts
this.s3Client = new S3Client({
  region: this.configService.get<string>('AWS_REGION'), // 'us-east-1'
  // Remove endpoint (uses default AWS S3)
  // credentials automatically loaded from IAM role
});
```

**S3 vs R2 Cost Comparison** (5GB storage, 200 students):

| Feature | Cloudflare R2 | AWS S3 |
|---------|---------------|--------|
| Storage (5GB) | $0 | $0.115/month |
| PUT requests (400/month) | $0 | $0.002/month |
| GET requests (800/month) | $0 | $0.0003/month |
| Egress (5GB) | **$0** | **$0.45/month** |
| **Total** | **$0** | **$0.57/month** |

**Recommendation**: **Keep Cloudflare R2** unless you need:
- S3 Glacier for long-term archival (R2 doesn't have cold storage)
- S3 Object Lock for compliance (WORM - Write Once Read Many)
- S3 Batch Operations for mass file processing

---

### Phase 5: Build and Push Docker Image (30 minutes)

#### Step 1: Create Dockerfile (if not already created)

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

#### Step 2: Create ECR Repository

```bash
# Create Elastic Container Registry (ECR) repository
aws ecr create-repository \
  --repository-name learning-platform \
  --image-scanning-configuration scanOnPush=true

# Get repository URI
aws ecr describe-repositories \
  --repository-names learning-platform \
  --query 'repositories[0].repositoryUri' \
  --output text

# Example output:
# 123456789012.dkr.ecr.us-east-1.amazonaws.com/learning-platform
```

#### Step 3: Build and Push Docker Image

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/learning-platform"

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build Docker image
docker build -t learning-platform:latest .

# Tag image for ECR
docker tag learning-platform:latest ${ECR_REPO}:latest
docker tag learning-platform:latest ${ECR_REPO}:v1.0.0

# Push to ECR
docker push ${ECR_REPO}:latest
docker push ${ECR_REPO}:v1.0.0
```

---

### Phase 6: App Runner Service Creation (30 minutes)

#### Create App Runner Service

```bash
# Create apprunner.yaml config
cat > apprunner.yaml <<EOF
version: 1.0
runtime: nodejs18
build:
  commands:
    pre-build:
      - npm ci
      - npx prisma generate
    build:
      - npm run build
run:
  runtime-version: 18
  command: sh -c "npx prisma migrate deploy && node dist/main.js"
  network:
    port: 3000
    env:
      - name: NODE_ENV
        value: production
      - name: PORT
        value: 3000
  secrets:
    - name: DATABASE_URL
      value-from: "arn:aws:ssm:us-east-1:123456789012:parameter/learning-platform/DATABASE_URL"
    - name: JWT_SECRET
      value-from: "arn:aws:ssm:us-east-1:123456789012:parameter/learning-platform/JWT_SECRET"
    - name: JWT_REFRESH_SECRET
      value-from: "arn:aws:ssm:us-east-1:123456789012:parameter/learning-platform/JWT_REFRESH_SECRET"
EOF

# Create App Runner service using AWS Console (easier) or CLI:
# AWS Console → App Runner → Create service → Source: ECR → Select image
# OR use CLI:

aws apprunner create-service \
  --service-name learning-platform-api \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'${ECR_REPO}':latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "3000"
        },
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "arn:aws:ssm:us-east-1:'${AWS_ACCOUNT_ID}':parameter/learning-platform/DATABASE_URL",
          "JWT_SECRET": "arn:aws:ssm:us-east-1:'${AWS_ACCOUNT_ID}':parameter/learning-platform/JWT_SECRET",
          "JWT_REFRESH_SECRET": "arn:aws:ssm:us-east-1:'${AWS_ACCOUNT_ID}':parameter/learning-platform/JWT_REFRESH_SECRET"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB",
    "InstanceRoleArn": "arn:aws:iam::'${AWS_ACCOUNT_ID}':role/LearningPlatformAppRunnerRole"
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/api/v1/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }' \
  --auto-scaling-configuration-arn 'arn:aws:apprunner:us-east-1:'${AWS_ACCOUNT_ID}':autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001'
```

**Wait for service to deploy** (5-10 minutes):

```bash
# Check status
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:${AWS_ACCOUNT_ID}:service/learning-platform-api/xxxxx \
  --query 'Service.Status' \
  --output text

# Get service URL
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:${AWS_ACCOUNT_ID}:service/learning-platform-api/xxxxx \
  --query 'Service.ServiceUrl' \
  --output text

# Example output:
# abcdefgh.us-east-1.awsapprunner.com
```

#### Test Deployment

```bash
# Get App Runner URL
APP_RUNNER_URL=$(aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:${AWS_ACCOUNT_ID}:service/learning-platform-api/xxxxx \
  --query 'Service.ServiceUrl' \
  --output text)

# Test health endpoint
curl https://${APP_RUNNER_URL}/api/v1/health

# Expected output:
# {
#   "status": "healthy",
#   "database": "connected",
#   "timestamp": "2025-12-08T10:30:00.000Z",
#   "uptime": 45.123
# }

# Test Swagger docs
open https://${APP_RUNNER_URL}/api-docs
```

---

### Phase 7: EventBridge + Lambda Cron Setup (45 minutes)

#### Step 1: Create Lambda Function for Homework Assignment

**Create Lambda deployment package**:

```bash
# Create lambda directory
mkdir -p lambda-cron
cd lambda-cron

# Create package.json
cat > package.json <<EOF
{
  "name": "homework-assignment-cron",
  "version": "1.0.0",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
EOF

# Install dependencies
npm install

# Create Lambda function code
cat > index.js <<EOF
const axios = require('axios');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Starting weekly homework assignment cron job');

  try {
    // Get CRON_SECRET from Parameter Store
    const getParameterCommand = new GetParameterCommand({
      Name: '/learning-platform/CRON_SECRET',
      WithDecryption: true,
    });
    const response = await ssmClient.send(getParameterCommand);
    const cronSecret = response.Parameter.Value;

    // Call API endpoint
    const apiUrl = process.env.API_URL + '/api/v1/cron/assign-homework';
    const result = await axios.post(apiUrl, {}, {
      headers: {
        'X-Cron-Secret': cronSecret,
      },
      timeout: 60000, // 60 seconds
    });

    console.log('Homework assignment successful:', result.data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Homework assignment completed successfully',
        result: result.data,
      }),
    };
  } catch (error) {
    console.error('Homework assignment failed:', error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Homework assignment failed',
        error: error.message,
      }),
    };
  }
};
EOF

# Install AWS SDK
npm install @aws-sdk/client-ssm

# Create deployment package
zip -r homework-cron.zip index.js node_modules package.json
```

#### Step 2: Deploy Lambda Function

```bash
# Create Lambda function
aws lambda create-function \
  --function-name homework-assignment-cron \
  --runtime nodejs18.x \
  --role arn:aws:iam::${AWS_ACCOUNT_ID}:role/LearningPlatformLambdaCronRole \
  --handler index.handler \
  --zip-file fileb://homework-cron.zip \
  --timeout 60 \
  --memory-size 256 \
  --environment Variables="{API_URL=https://${APP_RUNNER_URL}}"
```

#### Step 3: Create EventBridge Rule

```bash
# Create EventBridge rule (every Monday at 8 AM UTC)
aws events put-rule \
  --name homework-assignment-schedule \
  --description "Trigger homework assignment every Monday at 8 AM" \
  --schedule-expression "cron(0 8 ? * MON *)"

# Add Lambda as target
aws events put-targets \
  --rule homework-assignment-schedule \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:${AWS_ACCOUNT_ID}:function:homework-assignment-cron"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name homework-assignment-cron \
  --statement-id AllowEventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:${AWS_ACCOUNT_ID}:rule/homework-assignment-schedule
```

#### Step 4: Test Cron Job

```bash
# Manually invoke Lambda to test
aws lambda invoke \
  --function-name homework-assignment-cron \
  --payload '{}' \
  response.json

# Check output
cat response.json

# Expected output:
# {
#   "statusCode": 200,
#   "body": "{\"message\":\"Homework assignment completed successfully\",\"result\":{...}}"
# }
```

**EventBridge Cron Syntax**:

| Schedule | Expression |
|----------|------------|
| Every Monday at 8 AM | `cron(0 8 ? * MON *)` |
| Every day at 6 AM | `cron(0 6 * * ? *)` |
| Every 15 minutes | `rate(15 minutes)` |
| Every hour | `rate(1 hour)` |

---

### Phase 8: CloudWatch Logging and Monitoring (30 minutes)

#### Step 1: Enable CloudWatch Logs

App Runner automatically sends logs to CloudWatch. Access them:

```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name /aws/apprunner/learning-platform-api/xxxxx/application \
  --order-by LastEventTime \
  --descending

# Tail logs (live)
aws logs tail \
  --log-group-name /aws/apprunner/learning-platform-api/xxxxx/application \
  --follow
```

#### Step 2: Create CloudWatch Alarms

```bash
# Alarm 1: High error rate (>10 errors in 5 minutes)
aws cloudwatch put-metric-alarm \
  --alarm-name learning-platform-high-error-rate \
  --alarm-description "Alert when error rate exceeds 10 errors in 5 minutes" \
  --metric-name 5xxStatus \
  --namespace AWS/AppRunner \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=learning-platform-api

# Alarm 2: High response time (p95 >1000ms)
aws cloudwatch put-metric-alarm \
  --alarm-name learning-platform-high-latency \
  --alarm-description "Alert when p95 latency exceeds 1 second" \
  --metric-name RequestLatency \
  --namespace AWS/AppRunner \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=learning-platform-api

# Alarm 3: Service unhealthy
aws cloudwatch put-metric-alarm \
  --alarm-name learning-platform-unhealthy \
  --alarm-description "Alert when service health check fails" \
  --metric-name HealthCheckStatus \
  --namespace AWS/AppRunner \
  --statistic Minimum \
  --period 60 \
  --evaluation-periods 3 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=ServiceName,Value=learning-platform-api
```

#### Step 3: Set Up SNS Notifications (Optional)

```bash
# Create SNS topic
aws sns create-topic --name learning-platform-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:${AWS_ACCOUNT_ID}:learning-platform-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Update alarms to send to SNS
aws cloudwatch put-metric-alarm \
  --alarm-name learning-platform-high-error-rate \
  ... \
  --alarm-actions arn:aws:sns:us-east-1:${AWS_ACCOUNT_ID}:learning-platform-alerts
```

---

### Phase 9: Custom Domain and SSL (Optional, 20 minutes)

```bash
# Add custom domain to App Runner
aws apprunner associate-custom-domain \
  --service-arn arn:aws:apprunner:us-east-1:${AWS_ACCOUNT_ID}:service/learning-platform-api/xxxxx \
  --domain-name api.yourdomain.com

# Get DNS validation records
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:${AWS_ACCOUNT_ID}:service/learning-platform-api/xxxxx

# Add CNAME records to your DNS provider:
# api.yourdomain.com → abcdefgh.us-east-1.awsapprunner.com
# _validation.api.yourdomain.com → <validation-value>

# Wait for validation (5-10 minutes)
# App Runner automatically provisions SSL certificate via ACM
```

---

## INFRASTRUCTURE AS CODE

### CloudFormation Template (Complete AWS Stack)

**File**: `infrastructure/cloudformation-stack.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Learning Platform - Complete AWS Infrastructure'

Parameters:
  DatabasePassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS PostgreSQL'
    MinLength: 8

  JWTSecret:
    Type: String
    NoEcho: true
    Description: 'JWT secret for authentication'

  JWTRefreshSecret:
    Type: String
    NoEcho: true
    Description: 'JWT refresh secret'

  CronSecret:
    Type: String
    NoEcho: true
    Description: 'Cron job authentication secret'

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: learning-platform-vpc

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: learning-platform-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (2 AZs for RDS Multi-AZ)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: learning-platform-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: learning-platform-public-subnet-2

  # Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: learning-platform-public-rt

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Group for RDS
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS PostgreSQL'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: 10.0.0.0/16
      Tags:
        - Key: Name
          Value: learning-platform-db-sg

  # RDS Subnet Group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for learning platform database'
      SubnetIds:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: learning-platform-db-subnet-group

  # RDS PostgreSQL Instance
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: learning-platform-db
      DBInstanceClass: db.t4g.micro
      Engine: postgres
      EngineVersion: '15.4'
      MasterUsername: postgres
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      PubliclyAccessible: false
      EnableCloudwatchLogsExports:
        - postgresql
      AutoMinorVersionUpgrade: true
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: learning-platform-db

  # S3 Bucket (Optional, can use Cloudflare R2)
  FileBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: english-learning-files
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: MoveToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 90
      CorsConfiguration:
        CorsRules:
          - AllowedOrigins:
              - 'https://yourdomain.com'
            AllowedMethods:
              - GET
              - PUT
              - POST
              - DELETE
            AllowedHeaders:
              - '*'
            ExposeHeaders:
              - ETag
            MaxAge: 3600

  # Parameter Store Secrets
  DatabaseURLParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /learning-platform/DATABASE_URL
      Type: SecureString
      Value: !Sub 'postgresql://postgres:${DatabasePassword}@${Database.Endpoint.Address}:5432/learning_platform'

  JWTSecretParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /learning-platform/JWT_SECRET
      Type: SecureString
      Value: !Ref JWTSecret

  JWTRefreshSecretParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /learning-platform/JWT_REFRESH_SECRET
      Type: SecureString
      Value: !Ref JWTRefreshSecret

  CronSecretParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /learning-platform/CRON_SECRET
      Type: SecureString
      Value: !Ref CronSecret

  # IAM Role for App Runner
  AppRunnerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: LearningPlatformAppRunnerRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: tasks.apprunner.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
      Policies:
        - PolicyName: AppRunnerAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:Connect
                Resource: !GetAtt Database.DBInstanceArn
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt FileBucket.Arn
                  - !Sub '${FileBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/learning-platform/*'

  # IAM Role for Lambda Cron
  LambdaCronRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: LearningPlatformLambdaCronRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: LambdaCronPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                Resource: !Ref CronSecretParameter

Outputs:
  DatabaseEndpoint:
    Description: 'RDS PostgreSQL endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  DatabasePort:
    Description: 'RDS PostgreSQL port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DatabasePort'

  S3BucketName:
    Description: 'S3 bucket for file storage'
    Value: !Ref FileBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  AppRunnerRoleArn:
    Description: 'IAM role ARN for App Runner'
    Value: !GetAtt AppRunnerRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AppRunnerRoleArn'

  LambdaCronRoleArn:
    Description: 'IAM role ARN for Lambda cron'
    Value: !GetAtt LambdaCronRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaCronRoleArn'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2'
```

**Deploy CloudFormation Stack**:

```bash
# Deploy stack
aws cloudformation create-stack \
  --stack-name learning-platform \
  --template-body file://cloudformation-stack.yaml \
  --parameters \
    ParameterKey=DatabasePassword,ParameterValue=$(openssl rand -base64 32) \
    ParameterKey=JWTSecret,ParameterValue=$(openssl rand -base64 32) \
    ParameterKey=JWTRefreshSecret,ParameterValue=$(openssl rand -base64 32) \
    ParameterKey=CronSecret,ParameterValue=$(openssl rand -base64 32) \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for stack creation (15-20 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name learning-platform

# Get outputs
aws cloudformation describe-stacks \
  --stack-name learning-platform \
  --query 'Stacks[0].Outputs'
```

---

### Terraform Configuration (Alternative to CloudFormation)

**File**: `infrastructure/terraform/main.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "learning-platform-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "database_password" {
  description = "Master password for RDS PostgreSQL"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret"
  type        = string
  sensitive   = true
}

variable "cron_secret" {
  description = "Cron job authentication secret"
  type        = string
  sensitive   = true
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "learning-platform-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "learning-platform-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "learning-platform-public-subnet-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "learning-platform-public-subnet-2"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "learning-platform-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Security Group for RDS
resource "aws_security_group" "database" {
  name        = "learning-platform-db-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "learning-platform-db-sg"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "learning-platform-db-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "learning-platform-db-subnet-group"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier                 = "learning-platform-db"
  instance_class             = "db.t4g.micro"
  engine                     = "postgres"
  engine_version             = "15.4"
  username                   = "postgres"
  password                   = var.database_password
  allocated_storage          = 20
  storage_type               = "gp3"
  storage_encrypted          = true
  backup_retention_period    = 7
  preferred_backup_window    = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  db_subnet_group_name       = aws_db_subnet_group.main.name
  vpc_security_group_ids     = [aws_security_group.database.id]
  publicly_accessible        = false
  enabled_cloudwatch_logs_exports = ["postgresql"]
  auto_minor_version_upgrade = true
  deletion_protection        = true
  skip_final_snapshot        = false
  final_snapshot_identifier  = "learning-platform-db-final-snapshot"

  tags = {
    Name = "learning-platform-db"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "files" {
  bucket = "english-learning-files"

  tags = {
    Name = "english-learning-files"
  }
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "files" {
  bucket = aws_s3_bucket.files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  cors_rule {
    allowed_origins = ["https://yourdomain.com"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  rule {
    id     = "MoveToIA"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
  }
}

# Parameter Store Secrets
resource "aws_ssm_parameter" "database_url" {
  name  = "/learning-platform/DATABASE_URL"
  type  = "SecureString"
  value = "postgresql://postgres:${var.database_password}@${aws_db_instance.main.endpoint}/learning_platform"
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/learning-platform/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "jwt_refresh_secret" {
  name  = "/learning-platform/JWT_REFRESH_SECRET"
  type  = "SecureString"
  value = var.jwt_refresh_secret
}

resource "aws_ssm_parameter" "cron_secret" {
  name  = "/learning-platform/CRON_SECRET"
  type  = "SecureString"
  value = var.cron_secret
}

# IAM Role for App Runner
resource "aws_iam_role" "apprunner" {
  name = "LearningPlatformAppRunnerRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "apprunner" {
  name = "AppRunnerAccessPolicy"
  role = aws_iam_role.apprunner.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:Connect"
        ]
        Resource = aws_db_instance.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.files.arn,
          "${aws_s3_bucket.files.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/learning-platform/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/apprunner/*"
      }
    ]
  })
}

# IAM Role for Lambda Cron
resource "aws_iam_role" "lambda_cron" {
  name = "LearningPlatformLambdaCronRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_cron.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_cron" {
  name = "LambdaCronPolicy"
  role = aws_iam_role.lambda_cron.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = aws_ssm_parameter.cron_secret.arn
      }
    ]
  })
}

# Outputs
output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket for file storage"
  value       = aws_s3_bucket.files.id
}

output "apprunner_role_arn" {
  description = "IAM role ARN for App Runner"
  value       = aws_iam_role.apprunner.arn
}

output "lambda_cron_role_arn" {
  description = "IAM role ARN for Lambda cron"
  value       = aws_iam_role.lambda_cron.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_1_id" {
  description = "Public Subnet 1 ID"
  value       = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  description = "Public Subnet 2 ID"
  value       = aws_subnet.public_2.id
}
```

**Deploy with Terraform**:

```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Create terraform.tfvars with secrets
cat > terraform.tfvars <<EOF
database_password   = "$(openssl rand -base64 32)"
jwt_secret          = "$(openssl rand -base64 32)"
jwt_refresh_secret  = "$(openssl rand -base64 32)"
cron_secret         = "$(openssl rand -base64 32)"
EOF

# Plan deployment
terraform plan

# Apply (create infrastructure)
terraform apply -auto-approve

# Get outputs
terraform output
```

---

## MIGRATION GUIDE FROM RAILWAY

### Pre-Migration Checklist

- [ ] AWS account created and configured
- [ ] All IAM roles and policies created
- [ ] RDS PostgreSQL instance running (15-20 min wait)
- [ ] S3 bucket or R2 configured
- [ ] App Runner service deployed and tested
- [ ] Lambda cron function tested
- [ ] CloudWatch logging verified
- [ ] Team trained on AWS Console basics

### Migration Steps

#### Step 1: Data Export from Railway (30 minutes)

```bash
# Connect to Railway CLI
railway login
railway link

# Export database
railway run pg_dump $DATABASE_URL > railway-backup-$(date +%Y%m%d).sql

# Verify backup
ls -lh railway-backup-*.sql
# Should be several MB (depends on data size)

# Create backup of backup (safety)
cp railway-backup-*.sql railway-backup-safe.sql
```

#### Step 2: Data Import to AWS RDS (45 minutes)

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier learning-platform-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Test connection
psql -h $RDS_ENDPOINT -U postgres -d postgres -c "SELECT version();"

# Create database (if not exists)
psql -h $RDS_ENDPOINT -U postgres -d postgres -c "CREATE DATABASE learning_platform;"

# Import data
psql -h $RDS_ENDPOINT -U postgres -d learning_platform -f railway-backup-*.sql

# Verify data integrity
psql -h $RDS_ENDPOINT -U postgres -d learning_platform <<EOF
SELECT 'students', COUNT(*) FROM "Student";
SELECT 'words', COUNT(*) FROM "Word";
SELECT 'homeworks', COUNT(*) FROM "Homework";
SELECT 'content', COUNT(*) FROM "Content";
EOF

# Compare with Railway counts
railway run psql $DATABASE_URL <<EOF
SELECT 'students', COUNT(*) FROM "Student";
SELECT 'words', COUNT(*) FROM "Word";
SELECT 'homeworks', COUNT(*) FROM "Homework";
SELECT 'content', COUNT(*) FROM "Content";
EOF
```

#### Step 3: File Migration (if using S3 instead of R2)

```bash
# If migrating from Railway Volumes to S3 (rare)
# Skip this if staying with Cloudflare R2

# Install rclone
brew install rclone

# Configure R2 source
rclone config

# Sync R2 to S3
rclone sync r2:english-learning-files s3:english-learning-files --progress

# Verify file count
rclone ls r2:english-learning-files | wc -l
rclone ls s3:english-learning-files | wc -l
```

#### Step 4: Parallel Run (2-3 days)

**Week 1: Internal Testing**

```bash
# Deploy to AWS (already done)
# Test AWS endpoints internally

# Test health check
curl https://${APP_RUNNER_URL}/api/v1/health

# Test authentication
curl -X POST https://${APP_RUNNER_URL}/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Test file upload
curl -X POST https://${APP_RUNNER_URL}/api/v1/storage/upload-url \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.pdf","contentType":"application/pdf","homeworkId":"123"}'
```

**Week 2: Gradual Traffic Migration**

Use a load balancer or DNS-based traffic splitting:

1. **Day 1-2**: 10% traffic to AWS, 90% to Railway
2. **Day 3-4**: 25% traffic to AWS, 75% to Railway
3. **Day 5-6**: 50% traffic to AWS, 50% to Railway
4. **Day 7**: Monitor error rates on both platforms

**Monitoring During Parallel Run**:

```bash
# Railway logs
railway logs --follow

# AWS logs
aws logs tail /aws/apprunner/learning-platform-api/xxxxx/application --follow

# Compare error rates
# Railway error count (last hour)
railway logs --since 1h | grep "ERROR" | wc -l

# AWS error count (last hour)
aws logs filter-pattern "ERROR" \
  --log-group-name /aws/apprunner/learning-platform-api/xxxxx/application \
  --start-time $(date -u -v-1H +%s)000 \
  | jq '.events | length'
```

#### Step 5: DNS Cutover (5 minutes)

```bash
# Update DNS CNAME record
# OLD: api.yourdomain.com → yourapp.up.railway.app
# NEW: api.yourdomain.com → xxxxx.us-east-1.awsapprunner.com

# If using Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "xxxxx.us-east-1.awsapprunner.com"}]
      }
    }]
  }'

# Monitor DNS propagation
watch -n 5 'dig api.yourdomain.com +short'
```

#### Step 6: Monitor for 24-48 Hours

```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/AppRunner \
  --metric-name 2xxStatus \
  --dimensions Name=ServiceName,Value=learning-platform-api \
  --start-time $(date -u -v-1d +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum

# Check error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/AppRunner \
  --metric-name 5xxStatus \
  --dimensions Name=ServiceName,Value=learning-platform-api \
  --start-time $(date -u -v-1d +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum

# Monitor database connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=learning-platform-db \
  --start-time $(date -u -v-1d +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum
```

**Success Criteria**:
- 2xx response rate >99.5%
- 5xx error rate <0.1%
- p95 latency <500ms
- Database connections stable <10
- No cron job failures
- File upload/download success rate >99%

#### Step 7: Decommission Railway (After 1 Week)

```bash
# Stop Railway service (reversible)
railway down

# Wait 1 week, monitor for issues

# If all stable, delete Railway project
railway delete

# Cancel Railway subscription
# Railway Dashboard → Billing → Cancel Subscription
```

---

## COST COMPARISON

### Railway vs AWS (200 Students)

| Component | Railway | AWS | Savings |
|-----------|---------|-----|---------|
| Compute | $5/mo | $10/mo (App Runner 0.5 vCPU) | -$5 |
| Database (2GB) | $5/mo | $12/mo (db.t4g.micro) | -$7 |
| Bandwidth (50GB) | $2/mo | $0 (included) | +$2 |
| Cron Jobs | $0.50/mo | $0.003/mo (Lambda) | +$0.50 |
| File Storage (5GB) | $0 (using R2) | $0 (using R2) | $0 |
| **Total** | **$12.50/mo** | **$22/mo** | **-$9.50/mo** |

**Verdict**: Railway is **$115/year cheaper** for 200 students. Don't migrate yet!

---

### Railway vs AWS (1000 Students)

| Component | Railway | AWS | Savings |
|-----------|---------|-----|---------|
| Compute | $35/mo | $20/mo (App Runner 1 vCPU) | +$15 |
| Database (10GB) | $25/mo | $12/mo (db.t4g.micro) | +$13 |
| Bandwidth (200GB) | $15/mo | $0 (included) | +$15 |
| Cron Jobs | $1/mo | $0.003/mo (Lambda) | +$1 |
| File Storage (10GB) | $0 (using R2) | $0 (using R2) | $0 |
| **Total** | **$76/mo** | **$32/mo** | **+$44/mo** |

**Verdict**: AWS is **$528/year cheaper** for 1000 students. **Migrate now!**

---

### Railway vs AWS (5000 Students)

| Component | Railway | AWS | Savings |
|-----------|---------|-----|---------|
| Compute | $120/mo | $45/mo (App Runner 2 vCPU) | +$75 |
| Database (50GB) | $80/mo | $35/mo (db.t4g.small) | +$45 |
| Bandwidth (1TB) | $50/mo | $0 (included) | +$50 |
| Cron Jobs | $2/mo | $0.003/mo (Lambda) | +$2 |
| File Storage (50GB) | $0.25/mo (R2 paid) | $0.25/mo (R2 paid) | $0 |
| **Total** | **$252/mo** | **$80/mo** | **+$172/mo** |

**Verdict**: AWS is **$2,064/year cheaper** for 5000 students. **Massive savings!**

---

## COMPLEXITY COMPARISON

### Railway vs AWS (Setup Time and Knowledge)

| Task | Railway | AWS | Difference |
|------|---------|-----|------------|
| **Initial Setup** | 30 min | 4 hours | +3.5 hours |
| **Database Setup** | 2 min (1 command) | 45 min (RDS + VPC) | +43 min |
| **File Storage** | 0 min (R2 works) | 30 min (S3 setup) | +30 min |
| **Cron Jobs** | 5 min (platform cron) | 45 min (Lambda + EventBridge) | +40 min |
| **Deployment** | 1 command (`railway up`) | 10 commands (Docker + ECR + App Runner) | +9 commands |
| **Monitoring** | Built-in dashboard | 30 min (CloudWatch setup) | +30 min |
| **Custom Domain** | 2 min (1 click) | 15 min (Route 53 + ACM) | +13 min |
| **Secrets Management** | Environment variables | Parameter Store (IAM roles) | +20 min |
| **Total Time (First Deploy)** | **1 hour** | **8 hours** | **+7 hours** |

**Knowledge Requirements**:

| Concept | Railway | AWS |
|---------|---------|-----|
| Git | ✅ Required | ✅ Required |
| Docker | ❌ Optional | ✅ Required |
| Environment Variables | ✅ Required | ✅ Required |
| Database URLs | ✅ Required | ✅ Required |
| IAM Roles/Policies | ❌ Not needed | ✅ Required |
| VPC/Subnets | ❌ Not needed | ✅ Required |
| Security Groups | ❌ Not needed | ✅ Required |
| CloudWatch | ❌ Not needed | ✅ Required |
| ARNs (Resource IDs) | ❌ Not needed | ✅ Required |
| Infrastructure as Code | ❌ Optional | ⚠️ Highly recommended |

**Learning Curve**:
- Railway: **2 hours** (beginner-friendly)
- AWS: **40 hours** (intermediate level)

---

## ALTERNATIVE AWS ARCHITECTURES

### Option 2: AWS Elastic Beanstalk

**When to Use**:
- Need full control over EC2 instances
- Require custom load balancer configuration
- Want to use .ebextensions for advanced setup

**Setup Time**: 8 hours

**Monthly Cost** (1000 students):
- t3.small EC2 instance: $15
- Application Load Balancer: $16
- RDS db.t4g.micro: $12
- Total: **$43/month**

**Pros**:
- More control than App Runner
- Can SSH into instances
- Supports background workers

**Cons**:
- More complex (VPC, ALB, ASG)
- Higher cost than App Runner
- Requires EC2 knowledge

---

### Option 3: AWS ECS Fargate

**When to Use**:
- Microservices architecture
- Need multiple containers (API + Workers + Cache)
- Require advanced networking (service mesh)

**Setup Time**: 12 hours

**Monthly Cost** (1000 students):
- Fargate task (0.5 vCPU, 1GB RAM): $20
- Application Load Balancer: $16
- RDS db.t4g.micro: $12
- Total: **$48/month**

**Pros**:
- Best for microservices
- More control than App Runner
- Can run background workers in separate tasks

**Cons**:
- Most complex setup (task definitions, services, clusters)
- Requires understanding of Docker networking
- Overkill for monolithic NestJS app

---

### Option 4: AWS Lambda + API Gateway

**When to Use**:
- True serverless workload
- Irregular traffic (long idle periods)
- Cost optimization at all costs

**Setup Time**: 6 hours

**Monthly Cost** (1000 students, 1M requests/month):
- Lambda (1M requests, 512MB, 500ms avg): $8
- API Gateway (1M requests): $3.50
- RDS db.t4g.micro: $12
- Total: **$23.50/month**

**Pros**:
- Lowest cost at low traffic
- Auto-scaling to millions of requests
- Pay-per-request pricing

**Cons**:
- Cold start latency (1-3 seconds)
- 15-minute timeout (not ideal for long requests)
- Requires code changes (handler functions)
- Database connection pooling challenges

---

## SUMMARY

### Key Takeaways

1. **Start with Railway** ($12-25/month, 30-min setup)
   - Perfect for 200-500 students
   - Simplest developer experience
   - Fast iteration during MVP phase

2. **Migrate to AWS** when:
   - Monthly Railway bill >$80
   - Active students >1000
   - Need multi-region deployment
   - Require enterprise compliance

3. **Use Cloudflare R2** for file storage
   - FREE for 10GB (perfect for 200-1000 students)
   - Zero egress fees (S3 charges $0.09/GB)
   - Works with both Railway and AWS

4. **AWS App Runner** is the best AWS compute option
   - Simplest managed container service
   - Auto-scaling without configuration
   - Perfect for NestJS REST APIs

5. **Migration pays for itself** in 2-3 months
   - Upfront effort: 40-60 hours
   - Annual savings: $528/year @ 1000 students
   - Break-even: 2-3 months

### Final Recommendation

**Months 1-12**: Railway ($12-25/month)
- 200 students
- Fast iteration
- Minimal maintenance

**Months 13-24**: Railway ($25-60/month)
- 500 students
- Stable product
- Consider AWS when bill >$60

**Month 25+**: AWS App Runner ($32/month)
- 1000+ students
- Cost optimization
- Advanced features (multi-region, compliance)

**Reference This Guide**: When monthly Railway bill exceeds $80, return to this document and follow the migration steps.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-08
**Maintained By**: Engineering Team
**Next Review**: When Railway bill >$80/month
