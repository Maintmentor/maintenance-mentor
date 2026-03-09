# Storage Setup Examples

## Quick Reference for Common Operations

### 1. Upload a File

```typescript
import { supabase } from '@/lib/supabase';

// Upload with user-specific path
const uploadFile = async (file: File, userId: string) => {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${userId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('repair-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('repair-photos')
    .getPublicUrl(filePath);
    
  return urlData.publicUrl;
};
```

### 2. List Files in a Bucket

```typescript
const listFiles = async (bucketName: string, folder?: string) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(folder || '', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    
  if (error) throw error;
  return data;
};
```

### 3. Delete Files

```typescript
const deleteFile = async (bucketName: string, filePath: string) => {
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);
    
  if (error) throw error;
};

// Delete multiple files
const deleteMultiple = async (bucketName: string, filePaths: string[]) => {
  const { error } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);
    
  if (error) throw error;
};
```

### 4. Download a File

```typescript
const downloadFile = async (bucketName: string, filePath: string) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);
    
  if (error) throw error;
  
  // Create download link
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filePath.split('/').pop() || 'download';
  a.click();
};
```

### 5. Image Transformations

```typescript
const getOptimizedImage = (bucketName: string, filePath: string) => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath, {
      transform: {
        width: 800,
        height: 600,
        resize: 'cover', // or 'contain', 'fill'
        quality: 80
      }
    });
    
  return data.publicUrl;
};
```

### 6. Check if File Exists

```typescript
const fileExists = async (bucketName: string, filePath: string) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(filePath.split('/')[0], {
      search: filePath.split('/').pop()
    });
    
  return data && data.length > 0;
};
```

### 7. Get File Metadata

```typescript
const getFileInfo = async (bucketName: string, filePath: string) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(filePath.split('/').slice(0, -1).join('/'), {
      search: filePath.split('/').pop()
    });
    
  if (error) throw error;
  return data[0];
};
```

### 8. React Component Example

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File too large (max 10MB)',
        variant: 'destructive'
      });
      return;
    }
    
    setUploading(true);
    try {
      const filePath = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('repair-photos')
        .upload(filePath, file);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Upload failed',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        accept="image/*"
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

## Common RLS Policy Patterns

### Public Read, User Write
```sql
-- Anyone can view
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'repair-photos');

-- Only authenticated users can upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'repair-photos' 
  AND auth.role() = 'authenticated'
);
```

### User-Specific Access
```sql
-- Users can only access their own files
CREATE POLICY "User folder access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'user-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Admin Only
```sql
CREATE POLICY "Admin only"
ON storage.objects FOR ALL
USING (
  bucket_id = 'admin-files'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Troubleshooting

**403 Forbidden**: Check RLS policies
**File not found**: Verify bucket name and file path
**Upload timeout**: Check file size and connection
**CORS error**: Configure CORS in Supabase dashboard

## Best Practices

1. Always validate file size and type
2. Use unique file names (timestamp + random)
3. Organize files in user-specific folders
4. Set appropriate cache headers
5. Use image transformations for optimization
6. Implement cleanup for old files
7. Monitor storage usage regularly
8. Set up proper RLS policies
