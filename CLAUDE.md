# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CafAdmin is a Next.js 16 admin dashboard for managing Cover Art Factory mobile application. It manages design templates, collections, orders, partners, and prompt templates. The app uses the App Router with shadcn/ui (new-york style) and is deployed on AWS Amplify.

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

### Data Flow Pattern

The app uses a dual-layer data access pattern:

1. **External Admin API** (`lib/services/api-client.ts`): The `ExternalApiClient` class proxies most CRUD operations to external AWS Lambda endpoints. API routes in `app/api/` are thin wrappers that forward requests to these external services.

2. **Direct MongoDB** (`lib/services/mongodb-service.ts`): The `MongoDbService` class provides direct database access for some operations. Uses `lib/db/mongodb.ts` for connection pooling.

### Key Directories

- `app/api/` - API route handlers (proxy to external Admin API)
- `lib/services/` - Service layer with `ExternalApiClient`, `MongoDbService`, `AwsS3Service`
- `lib/types/` - TypeScript interfaces for domain models (Design, Order, Collection, Partner, etc.)
- `components/ui/` - shadcn/ui components
- `components/layout/` - Sidebar and Header layout components

### AWS Integration

- **S3 Buckets**: `coverartbucket` (designs), `cafpreviews`, `cafprocessing`, `caforders`
- **CloudFront**: Distribution ID `E2LSEELWH9D3YF` with cache invalidation support
- **File Uploads**: Uses presigned URLs for direct browser-to-S3 uploads (supports 500MB+ files). See `lib/upload-utils.ts` for `uploadToS3WithProgress()`.
- **Authentication**: IAM roles via AWS Amplify (no access keys in code)

### Database

MongoDB collections (via `COLLECTIONS` constant in `lib/db/mongodb.ts`):
- `templates` - Design templates (mapped as DESIGNS)
- `orders` - Customer orders
- `collections` - Design collections
- `macros` - Macros (legacy)

### Environment Variables

Required in `.env.local`:
- `MONGODB_URI`, `DATABASE_NAME`
- `APP_AWS_REGION`, `CLOUDFRONT_DISTRIBUTION_ID`
- `COLLECTIONS_API_BASE_URL`, `ADMIN_API_BASE_URL`, `ADMIN_API_KEY`

## Conventions

- Path alias `@/*` maps to project root
- UI components use shadcn/ui new-york style with Tailwind CSS
- Dark mode is enabled by default (`<html className="dark">`)
- Toast notifications via Sonner (`components/ui/sonner.tsx`)
- Drag-and-drop with @dnd-kit for collection reordering
