# Supabase Storage Setup & Management Guide

## Overview
This guide covers complete setup and management of Supabase storage buckets for file uploads, including security policies, access control, and best practices.

## Existing Storage Buckets

Your project currently has these buckets configured:

1. **repair-photos** (Public) - Created: 2025-09-16
2. **backups** (Private) - Created: 2025-09-24
3. **videos** (Public) - Created: 2025-10-05
4. **repair-images** (Public) - Created: 2025-10-11

## Creating New Storage Buckets

### Via Supabase Dashboard

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Configure:
   - **Name**: Use lowercase, hyphens only (e.g., `user-avatars`)
   - **Public bucket**: Toggle ON for publicly accessible files
   - **File size limit**: Set max file size (default: 50MB)
   - **Allowed MIME types**: Specify allowed file types

### Via SQL

```sql
-- Create a new bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bucket-name', 'bucket-name', true);
```

### Via Edge Function API

Use the `create_storage_bucket` tool in your deployment scripts.

## Row Level Security (RLS) Policies

### Public Read, Authenticated Write

```sql
-- Allow public to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'repair-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'repair-photos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'repair-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'repair-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Private Bucket (User-Specific Access)

```sql
-- Only allow users to access their own files
CREATE POLICY "Users access own files only"
ON storage.objects FOR ALL
USING (
  bucket_id = 'backups' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Admin-Only Access

```sql
-- Only admins can manage files
CREATE POLICY "Admin only access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'admin-files' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

## File Upload Best Practices

### 1. File Size Limits

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large. Max size: 10MB');
}
```

### 2. File Type Validation

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type');
}
```

### 3. Unique File Names

```typescript
const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
const filePath = `${userId}/${fileName}`;
```

### 4. Upload with Progress

```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.storage
  .from('repair-photos')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### 5. Get Public URL

```typescript
const { data } = supabase.storage
  .from('repair-photos')
  .getPublicUrl(filePath);

const publicUrl = data.publicUrl;
```

## Storage Optimization

### Image Optimization

```typescript
// Use Supabase image transformations
const optimizedUrl = supabase.storage
  .from('repair-photos')
  .getPublicUrl(filePath, {
    transform: {
      width: 800,
      height: 600,
      resize: 'contain',
      quality: 80
    }
  });
```

### Automatic Cleanup

Set up a scheduled function to delete old files:

```sql
-- Delete files older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'repair-photos'
AND created_at < NOW() - INTERVAL '90 days';
```

## Bucket Configuration Examples

### User Avatars
- **Public**: Yes
- **Max size**: 5MB
- **Types**: image/jpeg, image/png, image/webp
- **Path structure**: `{userId}/avatar.{ext}`

### Repair Photos
- **Public**: Yes
- **Max size**: 10MB
- **Types**: image/*
- **Path structure**: `{userId}/{repairId}/{timestamp}.{ext}`

### Video Content
- **Public**: Yes
- **Max size**: 100MB
- **Types**: video/mp4, video/webm
- **Path structure**: `videos/{categoryId}/{videoId}.{ext}`

### Backups
- **Public**: No
- **Max size**: 500MB
- **Types**: application/json, application/zip
- **Path structure**: `{userId}/backups/{timestamp}.{ext}`

## Monitoring & Analytics

### Storage Usage Query

```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size,
  AVG((metadata->>'size')::bigint) as avg_size
FROM storage.objects
GROUP BY bucket_id;
```

### Recent Uploads

```sql
SELECT 
  name,
  bucket_id,
  created_at,
  metadata->>'size' as size,
  metadata->>'mimetype' as mime_type
FROM storage.objects
ORDER BY created_at DESC
LIMIT 50;
```

## Troubleshooting

### Issue: 403 Forbidden on Upload
**Solution**: Check RLS policies and ensure user is authenticated

### Issue: File not found
**Solution**: Verify bucket is public or user has proper access

### Issue: Upload timeout
**Solution**: Check file size limits and network connection

### Issue: CORS errors
**Solution**: Configure CORS in Supabase dashboard under Storage settings

## Admin Panel Integration

Use the new **Storage Manager** in the admin panel to:
- View all buckets and their configurations
- Monitor storage usage in real-time
- See recent uploads across all buckets
- Clean up old or unused files
- Configure bucket settings
- Manage RLS policies
- View storage analytics

Access at: `/admin` → Storage Manager tab

## Security Checklist

- [ ] RLS policies enabled on all buckets
- [ ] File size limits configured
- [ ] File type validation implemented
- [ ] Unique file naming strategy
- [ ] Regular cleanup scheduled
- [ ] Public buckets reviewed for sensitive data
- [ ] Access logs monitored
- [ ] Backup strategy in place

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
