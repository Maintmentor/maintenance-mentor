# Automatic Image Storage System

## Overview
All DALL-E generated images are now automatically stored in Supabase Storage with permanent URLs that never expire.

## How It Works

### 1. Image Generation Flow
```
User asks question → DALL-E generates image → Download image → 
Upload to Supabase Storage → Return permanent URL → Store metadata in DB
```

### 2. Storage Structure
- **Bucket**: `repair-images` (public)
- **Path Format**: `{userId}/{timestamp}-{randomId}.png`
- **Example**: `abc123/1704067200000-a1b2c3d4.png`

### 3. Database Tracking
Table: `generated_images`
- Tracks all uploaded images
- Stores metadata (prompt, part name, file size)
- Automatic expiration after 90 days
- Access tracking for analytics

## Features

### Permanent URLs
- Images stored in Supabase Storage never expire
- No more broken links after 1 hour
- Direct CDN access for fast loading

### Automatic Cleanup
Images are automatically cleaned up after 90 days to save storage space.

**Manual Cleanup Options:**
```bash
# Cleanup expired images
curl -X POST https://your-project.supabase.co/functions/v1/image-cleanup-service \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"action": "cleanup-expired"}'

# Cleanup images older than X days
curl -X POST https://your-project.supabase.co/functions/v1/image-cleanup-service \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"action": "cleanup-old", "daysOld": 60}'

# Get storage statistics
curl -X POST https://your-project.supabase.co/functions/v1/image-cleanup-service \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"action": "stats"}'
```

### Metadata Tracking
Each image stores:
- Original DALL-E URL
- Storage path and public URL
- Generation prompt
- Part name
- File size
- Creation and expiration dates
- Access count and last accessed time

## Frontend Integration

The frontend automatically receives permanent URLs:

```typescript
const response = await supabase.functions.invoke('repair-diagnostic', {
  body: { 
    question: 'How do I fix a leaky faucet?',
    userId: user.id,
    conversationId: conversation.id
  }
});

// response.data.generatedImage is now a permanent Supabase Storage URL
// Example: https://your-project.supabase.co/storage/v1/object/public/repair-images/...
```

## Automated Cleanup Schedule

Set up a cron job to run cleanup daily:

### GitHub Actions (Recommended)
Create `.github/workflows/image-cleanup.yml`:

```yaml
name: Image Cleanup

on:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Expired Images
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/image-cleanup-service \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -d '{"action": "cleanup-expired"}'
```

### Supabase Cron (Alternative)
Use Supabase's pg_cron extension:

```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 2 AM
SELECT cron.schedule(
  'cleanup-expired-images',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/image-cleanup-service',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "cleanup-expired"}'::jsonb
  );
  $$
);
```

## Storage Limits

### Free Tier
- 1 GB storage
- ~1,000 high-quality images (1 MB each)

### Pro Tier
- 100 GB storage
- ~100,000 high-quality images

### Monitoring Storage
```sql
-- Check total storage used
SELECT 
  COUNT(*) as total_images,
  SUM(file_size_bytes) / (1024 * 1024) as total_mb,
  AVG(file_size_bytes) / 1024 as avg_kb
FROM generated_images;

-- Check images expiring soon
SELECT COUNT(*) 
FROM generated_images 
WHERE expires_at < NOW() + INTERVAL '7 days';
```

## Benefits

✅ **No More Broken Links**: Images stored permanently in Supabase
✅ **Fast Loading**: Direct CDN access
✅ **Cost Efficient**: Automatic cleanup after 90 days
✅ **Analytics Ready**: Track image usage and access patterns
✅ **Scalable**: Handles thousands of images efficiently
✅ **Secure**: Row Level Security policies protect user data

## Troubleshooting

### Images Not Uploading
1. Check storage bucket exists: `repair-images`
2. Verify bucket is public
3. Check service role key has storage permissions
4. Review edge function logs for errors

### Storage Full
1. Run manual cleanup for older images
2. Reduce expiration time (default 90 days)
3. Upgrade to Pro tier for more storage

### Slow Image Loading
1. Images are served via Supabase CDN
2. Check network connectivity
3. Verify public URL is accessible
4. Consider image optimization if needed
