# Deployment Checklist

## Environment Variables

Ensure the following environment variables are configured in your production environment (Vercel/hosting platform):

### Required Variables

```
ADMIN_API_BASE_URL=https://frir8eg1ah.execute-api.eu-north-1.amazonaws.com/production
ADMIN_API_KEY=<your-api-key>
```

## Vercel Deployment Steps

1. **Add Environment Variables**
   - Go to your Vercel project settings
   - Navigate to: Settings → Environment Variables
   - Add both `ADMIN_API_BASE_URL` and `ADMIN_API_KEY`
   - Set them for Production, Preview, and Development environments

2. **Redeploy**
   - After adding environment variables, trigger a new deployment
   - You can do this by pushing a new commit or manually triggering a redeploy in Vercel dashboard

3. **Verify Deployment**
   - Check the deployment logs for any errors
   - Test the order detail page: `https://admin.coverartfactory.com/orders/{orderId}`
   - Check browser console and network tab for any errors

## Troubleshooting

### If the page still doesn't work:

1. **Check Logs**
   - Go to Vercel → Your Project → Deployments → [Latest Deployment] → Functions
   - Look for logs from `/api/orders/[id]` route
   - The enhanced logging will show:
     - Environment variable status
     - API URL being called
     - Response status codes
     - Detailed error messages

2. **Common Issues**
   - Environment variables not set in Vercel
   - Environment variables set but deployment not rebuilt
   - CORS issues (unlikely since using server-side API routes)
   - API endpoint rate limiting or authentication issues

3. **Test API Directly**
   ```bash
   curl -H "x-api-key: YOUR_API_KEY" \
     https://frir8eg1ah.execute-api.eu-north-1.amazonaws.com/production/admin/orders/69358253b25c170375e9cd1e
   ```

## Route Configuration

The order detail API route has been configured with:
- `export const dynamic = 'force-dynamic'` - Forces dynamic rendering, no static optimization
- `export const revalidate = 0` - Disables caching
- `cache: 'no-store'` in fetch - Ensures fresh data on every request

These settings prevent Next.js from pre-rendering or caching the route during build time.
