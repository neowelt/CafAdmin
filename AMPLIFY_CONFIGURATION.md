# AWS Amplify Configuration for Presigned URL Uploads

## Overview

This application uses presigned URLs for direct browser-to-S3 uploads, which bypasses Next.js API routes for file transfer. This approach:

- Supports large files (500MB+)
- Bypasses CloudFront and Next.js body size limits
- Reduces server costs and improves performance
- Uses IAM roles instead of access keys

## Required AWS IAM Permissions

The Amplify service role must have the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::coverartbucket/*",
        "arn:aws:s3:::coverartbucket",
        "arn:aws:s3:::cafpreviews/*",
        "arn:aws:s3:::cafpreviews",
        "arn:aws:s3:::cafprocessing/*",
        "arn:aws:s3:::cafprocessing",
        "arn:aws:s3:::caforders/*",
        "arn:aws:s3:::caforders"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/E2LSEELWH9D3YF"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:eu-north-1:*:secret:production/caf/shared-*"
    }
  ]
}
```

## Setting Up IAM Role in Amplify

### Step 1: Find Your Amplify Service Role

1. Go to AWS Amplify Console
2. Select your app (CafAdmin)
3. Go to **App Settings** → **General**
4. Look for **Service role**
5. Click on the role name to open it in IAM Console

### Step 2: Attach Required Policies

In the IAM Console:

1. Click **Add permissions** → **Attach policies**
2. Create or attach policies with the permissions above
3. Recommended: Create a custom policy named `CafAdminS3Access`

### Step 3: Verify Role Trust Relationship

Ensure the trust relationship allows Amplify to assume the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## S3 Bucket CORS Configuration

For direct browser uploads to work, your S3 buckets must have proper CORS configuration.

### Apply to All Upload Buckets

Apply this CORS configuration to:
- `coverartbucket`
- `cafpreviews`
- `cafprocessing`
- `caforders`

### CORS Configuration JSON

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "https://main.d1v2w3x4y5z6a7.amplifyapp.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Important**: Replace `https://main.d1v2w3x4y5z6a7.amplifyapp.com` with your actual Amplify app URL.

### How to Apply CORS Configuration

#### Option 1: AWS Console

1. Go to S3 Console
2. Select your bucket (e.g., `coverartbucket`)
3. Click **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Paste the JSON above
7. Click **Save changes**
8. Repeat for all buckets

#### Option 2: AWS CLI

```bash
# Save CORS config to a file
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "https://main.d1v2w3x4y5z6a7.amplifyapp.com",
        "http://localhost:3000"
      ],
      "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Apply to all buckets
aws s3api put-bucket-cors --bucket coverartbucket --cors-configuration file://cors-config.json
aws s3api put-bucket-cors --bucket cafpreviews --cors-configuration file://cors-config.json
aws s3api put-bucket-cors --bucket cafprocessing --cors-configuration file://cors-config.json
aws s3api put-bucket-cors --bucket caforders --cors-configuration file://cors-config.json
```

## Amplify Environment Variables

Set these in Amplify Console → App Settings → Environment variables:

```bash
# AWS Configuration
APP_AWS_REGION=eu-north-1

# S3 Buckets
S3_DESIGNS_BUCKET=coverartbucket
S3_PREVIEWS_BUCKET=cafpreviews
S3_PROCESSING_BUCKET=cafprocessing
S3_ORDERS_BUCKET=caforders
S3_UPLOADS_BUCKET=coverartbucket

# CloudFront
CLOUDFRONT_DISTRIBUTION_ID=E2LSEELWH9D3YF
CLOUDFRONT_BASE_URL=https://d1234567890.cloudfront.net

# Admin API
ADMIN_API_BASE_URL=https://your-api.execute-api.eu-north-1.amazonaws.com/production
ADMIN_API_KEY=your-admin-api-key

# Next.js
NEXT_PUBLIC_APP_NAME=CafAdmin
```

## How It Works

### 1. Client Requests Presigned URL

```
Browser → /api/upload/presign?fileName=file.psd&contentType=application/psd
        ← { uploadUrl: "https://s3.amazonaws.com/...", fileUrl: "...", key: "..." }
```

### 2. Client Uploads Directly to S3

```
Browser → PUT https://s3.amazonaws.com/coverartbucket/uploads/file.psd
        ← 200 OK
```

### 3. Server Uses IAM Role

The `/api/upload/presign` route:
- Runs in Node.js runtime (not Edge)
- Uses AWS SDK with automatic IAM role credentials
- Generates presigned URL with 1-hour expiration
- Does NOT handle file data

## Troubleshooting

### "Access Denied" Error

**Problem**: Presigned URL returns 403 Access Denied

**Solutions**:
1. Verify IAM role has `s3:PutObject` permission
2. Check bucket policy doesn't deny uploads
3. Ensure bucket exists and name is correct

### CORS Error in Browser

**Problem**: Browser shows CORS error during upload

**Solutions**:
1. Verify CORS configuration on S3 bucket
2. Check `AllowedOrigins` includes your domain
3. Ensure `PUT` method is in `AllowedMethods`
4. Clear browser cache and retry

### "Signature Expired" Error

**Problem**: Upload fails with expired signature

**Solutions**:
1. Check server time is synchronized
2. Increase presigned URL expiration time
3. Generate new URL closer to upload time

### Upload Stalls or Times Out

**Problem**: Large files fail to upload

**Solutions**:
1. Increase presigned URL expiration to 2 hours
2. Check network connection stability
3. Verify S3 bucket region matches configuration
4. Use progress tracking to monitor upload

### IAM Role Not Found

**Problem**: "Unable to locate credentials"

**Solutions**:
1. Verify Amplify service role is attached
2. Check role has necessary permissions
3. Rebuild and redeploy the Amplify app
4. Check CloudWatch logs for detailed errors

## Security Considerations

### Presigned URL Expiration

Presigned URLs are valid for 1 hour by default. This is sufficient for:
- Large files (500MB) on slow connections (~1 Mbps)
- Multiple retry attempts
- User delays during upload

### File Validation

The API route validates:
- `fileName` parameter is provided
- `contentType` parameter is provided
- Bucket name (if provided) is allowed

**Client-side validation** should also check:
- File size limits
- File type restrictions
- File name sanitization

### Bucket Security

Ensure S3 buckets:
- Have public access blocked
- Use server-side encryption (AES256)
- Have versioning enabled for critical files
- Have lifecycle policies for old files

## Monitoring and Logging

### CloudWatch Logs

Check Amplify function logs:
```bash
aws logs tail /aws/lambda/amplify-function-name --follow
```

### S3 Access Logs

Enable S3 access logging to track uploads:
1. Go to S3 bucket → Properties → Server access logging
2. Enable logging to a separate logging bucket
3. Monitor for unusual activity

### Cost Monitoring

Track costs in AWS Cost Explorer:
- S3 PUT requests
- S3 storage
- Data transfer out
- CloudFront requests

## Testing Locally

To test presigned URL uploads locally:

1. Configure AWS credentials:
```bash
aws configure
```

2. Run development server:
```bash
npm run dev
```

3. Upload a test file using the UI

4. Verify file appears in S3:
```bash
aws s3 ls s3://coverartbucket/uploads/
```

## Production Deployment Checklist

- [ ] IAM role configured with S3 permissions
- [ ] CORS configured on all S3 buckets
- [ ] Environment variables set in Amplify Console
- [ ] Presigned URL API route deployed
- [ ] Client upload functions integrated
- [ ] Error handling and user feedback implemented
- [ ] Progress tracking working for large files
- [ ] CloudFront cache invalidation tested
- [ ] File size limits tested (500MB+)
- [ ] CORS tested from production domain
- [ ] Monitoring and alerts configured

## Additional Resources

- [AWS S3 Presigned URLs Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Amplify IAM Roles](https://docs.aws.amazon.com/amplify/latest/userguide/how-to-service-role-amplify-console.html)
- [S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
