# Finest 9 - AWS Deployment Guide

This guide provides step-by-step instructions for deploying the Finest 9 game to AWS S3 + CloudFront.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Node.js and npm installed
- Production build completed (`npm run build`)

## Build Status

✅ **Production Build**: Successfully created at `dist/finest9/`
- Total bundle size: ~382 KB (uncompressed)
- Gzipped size: ~110 KB
- All components and services included

## Deployment Steps

### 1. Create S3 Bucket

```bash
# Choose a unique bucket name (S3 bucket names must be globally unique)
BUCKET_NAME="finest9-game"
AWS_REGION="us-east-1"

# Create the bucket
aws s3 mb s3://${BUCKET_NAME} --region ${AWS_REGION}
```

### 2. Configure S3 Bucket for Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://${BUCKET_NAME} \
  --index-document index.html \
  --error-document index.html
```

**Note**: We use `index.html` for both index and error documents to support Angular's client-side routing.

### 3. Upload Built Files to S3

```bash
# Sync the build directory to S3
aws s3 sync dist/finest9/ s3://${BUCKET_NAME} --delete

# Set correct cache headers for assets
aws s3 cp s3://${BUCKET_NAME}/assets s3://${BUCKET_NAME}/assets \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000"

# Set shorter cache for index.html
aws s3 cp s3://${BUCKET_NAME}/index.html s3://${BUCKET_NAME}/index.html \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=0, must-revalidate"
```

### 4. Configure Bucket Policy for Public Access

Create a bucket policy file (`bucket-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::finest9-game/*"
    }
  ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --policy file://bucket-policy.json
```

**Important**: This makes your bucket publicly readable. Ensure this is acceptable for your use case.

### 5. Create CloudFront Distribution

Create a CloudFront distribution config file (`cloudfront-config.json`):

```json
{
  "CallerReference": "finest9-$(date +%s)",
  "Comment": "Finest 9 Game Distribution",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-finest9",
        "DomainName": "finest9-game.s3-website-us-east-1.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-finest9",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html"
}
```

**Simplified Alternative**: Use the AWS CLI command:

```bash
# Create distribution (returns distribution ID)
aws cloudfront create-distribution \
  --origin-domain-name ${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com \
  --default-root-object index.html
```

### 6. Configure Custom Error Pages (Important for SPA Routing)

This ensures that Angular's routing works correctly:

```bash
# Get your distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='Finest 9 Game Distribution'].Id" \
  --output text)

# Create error response config
cat > error-config.json << EOF
{
  "DistributionConfig": {
    "CustomErrorResponses": {
      "Quantity": 2,
      "Items": [
        {
          "ErrorCode": 404,
          "ResponsePagePath": "/index.html",
          "ResponseCode": "200",
          "ErrorCachingMinTTL": 300
        },
        {
          "ErrorCode": 403,
          "ResponsePagePath": "/index.html",
          "ResponseCode": "200",
          "ErrorCachingMinTTL": 300
        }
      ]
    }
  }
}
EOF
```

### 7. Get Your CloudFront URL

```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='Finest 9 Game Distribution'].DomainName" \
  --output text
```

Your app will be available at: `https://<distribution-id>.cloudfront.net`

## Updating the Deployment

When you make changes to the app:

```bash
# 1. Build the app
npm run build

# 2. Upload to S3
aws s3 sync dist/finest9/ s3://${BUCKET_NAME} --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"
```

## One-Command Deployment Script

Create a deployment script (`deploy.sh`):

```bash
#!/bin/bash
set -e

BUCKET_NAME="finest9-game"
DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"  # Replace with your actual ID

echo "Building application..."
npm run build

echo "Uploading to S3..."
aws s3 sync dist/finest9/ s3://${BUCKET_NAME} --delete

echo "Setting cache headers..."
aws s3 cp s3://${BUCKET_NAME}/assets s3://${BUCKET_NAME}/assets \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000"

aws s3 cp s3://${BUCKET_NAME}/index.html s3://${BUCKET_NAME}/index.html \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=0, must-revalidate"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"

echo "Deployment complete!"
echo "Your app is available at: https://YOUR_DOMAIN.cloudfront.net"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Cost Estimation

**Typical Monthly Costs** (low traffic):
- **S3 Storage**: ~$0.023 per GB/month
  - Estimated: $0.01/month (for ~382 KB app)
- **S3 Requests**: $0.0004 per 1,000 GET requests
  - Estimated: $0.10/month (for 10,000 page loads)
- **CloudFront**: First 1 TB of data transfer is $0.085/GB
  - Estimated: $3.40/month (for 40 GB transfer)
- **Total Estimated**: ~$3.50/month

**Free Tier Benefits**:
- CloudFront: 1 TB data transfer out free for 12 months
- S3: 5 GB storage free for 12 months

## Custom Domain (Optional)

To use a custom domain:

1. **Register domain** in Route 53 or use existing domain
2. **Request SSL certificate** in ACM (us-east-1 region)
3. **Add alternate domain name** to CloudFront distribution
4. **Create Route 53 record** pointing to CloudFront

```bash
# Example: Add custom domain to CloudFront
aws cloudfront update-distribution \
  --id ${DISTRIBUTION_ID} \
  --distribution-config file://distribution-config-with-domain.json
```

## Troubleshooting

### Issue: 404 errors on page refresh
**Solution**: Ensure custom error responses are configured to redirect 404 to `/index.html` with 200 status code.

### Issue: Changes not appearing
**Solution**: Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"
```

### Issue: CORS errors
**Solution**: Add CORS configuration to S3 bucket:
```bash
aws s3api put-bucket-cors \
  --bucket ${BUCKET_NAME} \
  --cors-configuration file://cors-config.json
```

## Security Best Practices

1. **Use CloudFront** instead of direct S3 access
2. **Enable HTTPS only** via CloudFront viewer protocol policy
3. **Use Origin Access Identity (OAI)** to restrict S3 access to only CloudFront
4. **Enable CloudFront logging** for monitoring
5. **Set appropriate cache headers** for assets vs HTML

## Monitoring

Set up CloudWatch alarms for:
- High error rates (4xx/5xx)
- Unusual traffic patterns
- High data transfer costs

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name finest9-high-4xx-errors \
  --alarm-description "Alert when 4xx errors exceed threshold" \
  --metric-name 4xxErrorRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

## Rollback Procedure

If you need to rollback to a previous version:

1. Keep previous build artifacts
2. Re-upload previous version to S3
3. Invalidate CloudFront cache

## Support

For issues related to:
- **Game functionality**: Check browser console for errors
- **AWS deployment**: Review CloudWatch logs and S3 access logs
- **Performance**: Use CloudFront analytics and reports

---

## Quick Reference

**Dev Server**: `http://localhost:5173`
**Preview Server**: `http://localhost:4173`
**Production**: `https://<distribution-id>.cloudfront.net`

**Commands**:
- Build: `npm run build`
- Preview: `npm run preview`
- Deploy: `./deploy.sh` (after setup)
