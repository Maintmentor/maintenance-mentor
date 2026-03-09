# Image Cache System Setup Guide

## Overview
The image cache system stores frequently searched product images in Supabase storage to reduce Google API calls and improve load times.

## Features
✅ Automatic caching of Google image search results
✅ 30-day cache expiration with automatic refresh
✅ Cache hit/miss analytics tracking
✅ Admin dashboard for monitoring
✅ Automated daily cleanup of expired entries
✅ Weekly cache prewarming for popular queries
✅ Storage usage tracking
✅ Response time monitoring

## Setup Instructions

### 1. Run Database Migration
```bash
# Apply the migration to create cache tables
psql -h your-supabase-db-host -U postgres -d postgres -f supabase/migrations/20250112_image_cache_system.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/migrations/20250112_image_cache_system.sql`
3. Run the SQL

### 2. Create Supabase Storage Bucket
1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `product-images`
3. Set it to **Public** (so cached images are accessible)
4. Configure CORS if needed

### 3. Deploy Edge Function
```bash
# Deploy the image cache handler
supabase functions deploy image-cache-handler

# Set required environment variables
supabase secrets set GOOGLE_API_KEY=your_google_api_key
supabase secrets set GOOGLE_CSE_ID=your_custom_search_engine_id
```

### 4. Configure GitHub Actions (Optional)
Add these secrets to your GitHub repository:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

The workflows will automatically:
- Clean expired cache daily at 2 AM UTC
- Prewarm popular queries weekly on Sundays

### 5. Add to Admin Dashboard
The `ImageCacheManager` component is already created. Add it to your admin panel:

```tsx
import { ImageCacheManager } from '@/components/admin/ImageCacheManager';

// In your admin routes
<Route path="/admin/cache" element={<ImageCacheManager />} />
```

## Usage in Your Application

### Replace Direct Google API Calls
```tsx
// OLD: Direct Google API call
const imageUrl = await fetchFromGoogleAPI(query);

// NEW: Use cache service
import { imageCacheService } from '@/services/imageCacheService';
const imageUrl = await imageCacheService.getImage(query);
```

### Get Cache Statistics
```tsx
const stats = await imageCacheService.getCacheStats();
console.log(`Cache hit rate: ${stats.cacheHitRate}%`);
console.log(`Storage used: ${stats.totalStorageUsed} bytes`);
```

### Force Refresh an Image
```tsx
const freshImageUrl = await imageCacheService.refreshImage(query);
```

## How It Works

1. **First Request**: Image is fetched from Google API, stored in Supabase storage, and metadata saved to database
2. **Subsequent Requests**: Image is served from Supabase storage (much faster)
3. **Analytics**: Every request logs hit/miss data for monitoring
4. **Expiration**: After 30 days, cache entry expires and will be refreshed on next request
5. **Cleanup**: Automated job runs daily to mark expired entries as inactive

## Performance Benefits

- **Reduced API Costs**: Google API calls only made once per unique query
- **Faster Load Times**: Cached images load 3-5x faster than API calls
- **Better UX**: Instant image display for cached queries
- **Analytics**: Track most popular searches and optimize accordingly

## Monitoring

Access the admin dashboard at `/admin/cache` to view:
- Total cached images
- Cache hit rate percentage
- Average response time
- Storage usage
- Top cached queries
- Recent cache activity

## Maintenance

### Manual Cache Cleanup
```tsx
const clearedCount = await imageCacheService.clearExpiredCache();
```

### Delete Specific Cached Image
```tsx
await imageCacheService.deleteCachedImage(cacheKey);
```

### View All Cached Images
```tsx
const images = await imageCacheService.getCachedImages(50);
```

## Troubleshooting

### Images Not Caching
1. Check Supabase storage bucket exists and is public
2. Verify edge function is deployed: `supabase functions list`
3. Check edge function logs: `supabase functions logs image-cache-handler`

### High Storage Usage
1. Reduce cache expiration time in migration (default: 30 days)
2. Run manual cleanup more frequently
3. Delete unused cached images from admin dashboard

### Low Cache Hit Rate
1. Enable cache prewarming for popular queries
2. Increase cache expiration time
3. Review top queries and ensure they're being cached

## Cost Savings Estimate

With 1000 unique product searches:
- **Without Cache**: 1000 Google API calls = $5.00
- **With Cache (80% hit rate)**: 200 Google API calls = $1.00
- **Savings**: $4.00 per 1000 searches (80% reduction)

Plus improved user experience with faster load times!
