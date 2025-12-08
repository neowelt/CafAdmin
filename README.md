# CafAdmin - Cover Art Factory Admin Dashboard

Next.js admin dashboard for managing Cover Art Factory mobile application templates, collections, and orders. Converted from Blazor/MudBlazor to Next.js with TypeScript and shadcn/ui.

## Features

### Designs Management
- List all design templates with search and sorting
- Create new design templates with multiple style variations
- Upload PSD files, fonts, and preview images to S3
- Edit existing templates
- Toggle publish status
- CloudFront cache invalidation on updates

### Collections Management
- Create and organize design collections
- Drag-and-drop reordering
- Add/remove designs from collections
- Toggle active/inactive status
- Visual design management with search

### Orders Management
- View all customer orders
- Filter by status (completed, pending, failed)
- Filter by date (today, last 7 days, last 30 days)
- Search by email, artist, title, or template name
- Preview order designs with S3 pre-signed URLs
- Download final designs
- Complete pending orders via Admin API

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Database**: MongoDB (MongoDB Atlas)
- **Cloud Storage**: AWS S3
- **CDN**: AWS CloudFront
- **Authentication**: AWS Amplify (configured at hosting level)
- **Drag & Drop**: @dnd-kit

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

### MongoDB Configuration
```bash
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=cafapp
```

### AWS Configuration

**Important**: AWS Amplify does not allow environment variables starting with `AWS_`. Use the `APP_AWS_*` prefix instead.

**For Local Development:**
```bash
APP_AWS_REGION=eu-north-1
APP_AWS_ACCESS_KEY_ID=your-access-key
APP_AWS_SECRET_ACCESS_KEY=your-secret-key
CLOUDFRONT_DISTRIBUTION_ID=E2LSEELWH9D3YF
```

**For Production (AWS Amplify):**
```bash
APP_AWS_REGION=eu-north-1
CLOUDFRONT_DISTRIBUTION_ID=E2LSEELWH9D3YF
# DO NOT set APP_AWS_ACCESS_KEY_ID or APP_AWS_SECRET_ACCESS_KEY
# The app uses the Amplify service role IAM credentials automatically
```

### AWS IAM Role Setup (Production)

When deployed to AWS Amplify, the app uses IAM roles instead of access keys for better security.

**Required IAM Policy for Amplify Service Role:**

Create a policy named `CafAdminAmplifyPolicy` and attach it to your Amplify service role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Permissions",
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
        "arn:aws:s3:::cafpreviews"
      ]
    },
    {
      "Sid": "CloudFrontPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/E2LSEELWH9D3YF"
    }
  ]
}
```

**Setup Steps:**

1. Go to **AWS IAM Console** → **Roles**
2. Find or create your Amplify service role (usually named `amplifyconsole-backend-role` or similar)
3. Click **Add permissions** → **Create inline policy**
4. Paste the JSON policy above
5. Name it `CafAdminAmplifyPolicy` and save
6. In **AWS Amplify Console**, ensure this role is selected as your service role

### API Endpoints
```bash
COLLECTIONS_API_BASE_URL=https://93cniuwf3h.execute-api.eu-north-1.amazonaws.com/production
ADMIN_API_BASE_URL=https://frir8eg1ah.execute-api.eu-north-1.amazonaws.com/production
ADMIN_API_KEY=your-admin-api-key
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- AWS account with S3 and CloudFront access

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Deployment to AWS Amplify

1. Push code to GitHub repository

2. Connect Amplify to your repository:
   - Go to AWS Amplify Console
   - Click "New app" > "Host web app"
   - Select GitHub and authorize
   - Choose your repository and branch

3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. Add environment variables in Amplify Console:
   - Navigate to App Settings > Environment variables
   - Add all variables from `.env.local`

5. Configure authentication:
   - Set up Cognito or OIDC authentication in Amplify
   - Configure access restrictions

6. Deploy:
   - Amplify will automatically build and deploy on push to main branch

## API Routes

### Designs
- `GET /api/designs` - List all designs
- `POST /api/designs` - Create new design
- `GET /api/designs/:id` - Get design by ID
- `PUT /api/designs/:id` - Update design
- `DELETE /api/designs/:id` - Delete design

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/:slug` - Get collection with designs
- `PUT /api/collections/:slug` - Update collection designs
- `DELETE /api/collections/:slug` - Delete collection
- `PATCH /api/collections/:slug` - Toggle active status
- `PATCH /api/collections` - Update positions

### Orders
- `GET /api/orders` - List orders with filters
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders/:id/complete` - Complete order

### File Management
- `POST /api/files/upload` - Upload file directly to S3 (uses AWS SDK v3)
- `POST /api/files/cache/invalidate` - Invalidate CloudFront cache (uses AWS SDK v3)
- `POST /api/upload` - Legacy upload endpoint (deprecated)

## Database Collections

### templates (Designs)
- Design metadata and configuration
- Style variations with PSD files
- Font references
- Custom image settings

### orders
- Customer order information
- Template and style references
- Payment and transaction details
- S3 keys for previews and final designs

### collections
- Collection metadata
- Design ID references
- Position and active status

## Key Differences from Blazor Version

- **Authentication**: Handled by AWS Amplify at hosting level (removed Firebase Admin)
- **Macros**: Removed (not in use)
- **UI Framework**: shadcn/ui instead of MudBlazor
- **Database Models**: Maintained exact same MongoDB schema
- **S3 File Paths**: Same structure as Blazor version
- **File Uploads**: Direct S3 uploads via AWS SDK v3 (no FastAPI proxy needed)

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env.local
MONGODB_URI=mongodb://localhost:27017
```

### AWS S3 Upload Failures
```bash
# Verify AWS credentials
aws configure list

# Check S3 bucket permissions
aws s3 ls s3://coverartbucket
```

## Recent Changes

### 2025-12-08: IAM Role-Based Authentication for AWS Services

**Enhancement**: Switched from hardcoded AWS access keys to IAM role-based authentication for production deployments.

**Changes**:
- Updated S3Client and CloudFrontClient initialization to use conditional credentials
- Uses IAM role when running on AWS Amplify (production)
- Falls back to access keys for local development
- Updated documentation with IAM policy requirements and setup instructions

**Security Benefits**:
- No long-lived credentials stored in environment variables
- Automatic credential rotation by AWS
- Least privilege access control via IAM policies
- Reduced risk of credential leakage
- CloudTrail audit logging of all AWS API calls

**Configuration**:
- Production: Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from Amplify environment variables
- Production: Attach IAM policy to Amplify service role (see README for policy JSON)
- Local Dev: Continue using access keys in `.env.local`

### 2025-12-08: Fixed Image Corruption - Direct S3 Uploads

**Problem**: Images uploaded to S3 appeared corrupted/not displaying in browsers.

**Root Cause**: The FastAPI backend proxy was losing the `Content-Type` metadata when forwarding FormData, causing images to be uploaded with `application/octet-stream` instead of `image/jpeg`.

**Solution**: Removed the FastAPI proxy entirely and implemented direct S3 uploads from Next.js API routes using AWS SDK v3.

**Changes**:
- Installed `@aws-sdk/client-s3` and `@aws-sdk/client-cloudfront`
- Updated `/api/files/upload` to upload directly to S3 with proper `ContentType` header
- Updated `/api/files/cache/invalidate` to invalidate CloudFront cache directly
- Frontend continues to pass `content_type` in FormData for explicit type specification

**Benefits**:
- Eliminates proxy overhead and potential data corruption
- Faster uploads (one less network hop)
- Proper Content-Type headers preserved
- No backend deployment required for file upload changes

## License

Proprietary - Cover Art Factory
