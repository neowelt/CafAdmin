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

**Required for both Local and Production:**
```bash
APP_AWS_REGION=eu-north-1
CLOUDFRONT_DISTRIBUTION_ID=E2LSEELWH9D3YF
```

**Authentication:**

This application uses IAM roles for AWS service authentication instead of access keys:

- **Local Development**: Configure AWS credentials via AWS CLI (`aws configure`) or use IAM role if running on EC2
- **Production (Amplify)**: Amplify uses the IAM role attached to the Amplify service

**Required IAM Permissions:**

The IAM role needs the following permissions:

- S3: `PutObject`, `GetObject`, `DeleteObject`, `ListBucket` on buckets: `coverartbucket`, `cafpreviews`
- CloudFront: `CreateInvalidation`, `GetInvalidation` on distribution `E2LSEELWH9D3YF`
- Secrets Manager: `GetSecretValue` on secret `production/caf/shared`

**Amplify Console Setup:**

1. Go to AWS Amplify Console → Your App → App Settings → Environment variables
2. Add the following variables:
   - `APP_AWS_REGION=eu-north-1`
   - `CLOUDFRONT_DISTRIBUTION_ID=E2LSEELWH9D3YF`

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
- `GET /api/upload/presign` - Generate presigned URL for direct S3 uploads (supports large files 500MB+)
- `POST /api/files/download-url` - Generate presigned download URL for S3 files
- `POST /api/files/cache/invalidate` - Invalidate CloudFront cache

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
- **File Uploads**: Presigned URL uploads directly to S3 (supports large files 500MB+, uses IAM roles)

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

### 2025-12-10: Presigned URL Uploads for Large Files

**Problem**: Server-side uploads failed in Amplify and couldn't support large files (500MB+) due to body size limits.

**Solution**: Implemented presigned URL upload system where files upload directly from browser to S3, bypassing the Next.js server entirely.

**Changes**:
- Created `/api/upload/presign` route to generate presigned URLs using IAM roles
- Added `uploadToS3WithProgress()` client utility with progress tracking support
- Updated design form to use presigned URL uploads for PSD files, previews, and fonts
- Removed old server-side upload routes (`/api/upload` and `/api/files/upload`)
- Added comprehensive documentation in `UPLOAD_EXAMPLES.md` and `AMPLIFY_CONFIGURATION.md`

**Benefits**:
- Supports very large files (500MB+) without server memory constraints
- Bypasses CloudFront and Next.js body size limits
- Direct browser-to-S3 upload reduces bandwidth costs
- Real-time upload progress tracking
- Secure authentication using Amplify IAM roles (no exposed credentials)
- Better performance and scalability

**Migration**: All existing upload functionality automatically uses presigned URLs. Requires AWS S3 CORS configuration and IAM role permissions (see `AMPLIFY_CONFIGURATION.md`).

## License

Proprietary - Cover Art Factory
