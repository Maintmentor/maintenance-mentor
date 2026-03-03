import { supabase } from '@/lib/supabase';

export interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  created_at: string;
}

export interface StorageStats {
  bucket_id: string;
  file_count: number;
  total_size: number;
  avg_size: number;
}

export interface RecentFile {
  name: string;
  bucket_id: string;
  created_at: string;
  size: number;
  mime_type: string;
  id: string;
}

export const storageService = {
  async getBuckets(): Promise<BucketInfo[]> {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return data || [];
  },

  async getStorageStats(): Promise<StorageStats[]> {
    try {
      // Try to use RPC function first
      const { data, error } = await supabase.rpc('get_storage_stats');
      if (!error && data) return data;
    } catch (e) {
      console.log('RPC not available, using direct query');
    }

    // Fallback: calculate stats from buckets
    const buckets = await this.getBuckets();
    const stats: StorageStats[] = [];

    for (const bucket of buckets) {
      const { data: files } = await supabase.storage.from(bucket.id).list();
      
      const fileCount = files?.length || 0;
      const totalSize = files?.reduce((acc, f) => acc + (f.metadata?.size || 0), 0) || 0;
      const avgSize = fileCount > 0 ? totalSize / fileCount : 0;

      stats.push({
        bucket_id: bucket.id,
        file_count: fileCount,
        total_size: totalSize,
        avg_size: Math.round(avgSize)
      });
    }

    return stats;
  },

  async getRecentFiles(limit: number = 50): Promise<RecentFile[]> {
    const buckets = await this.getBuckets();
    const allFiles: RecentFile[] = [];

    for (const bucket of buckets) {
      const { data: files } = await supabase.storage.from(bucket.id).list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

      if (files) {
        files.forEach(file => {
          allFiles.push({
            id: file.id,
            name: file.name,
            bucket_id: bucket.id,
            created_at: file.created_at,
            size: file.metadata?.size || 0,
            mime_type: file.metadata?.mimetype || 'unknown'
          });
        });
      }
    }

    return allFiles
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  async cleanupOldFiles(bucketId: string, daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data: files } = await supabase.storage.from(bucketId).list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'asc' }
    });

    if (!files) return 0;

    const oldFiles = files.filter(f => 
      new Date(f.created_at) < cutoffDate
    );

    if (oldFiles.length === 0) return 0;

    const filePaths = oldFiles.map(f => f.name);
    const { error } = await supabase.storage.from(bucketId).remove(filePaths);

    if (error) throw error;

    return oldFiles.length;
  },

  async deleteFile(bucketId: string, filePath: string): Promise<void> {
    const { error } = await supabase.storage.from(bucketId).remove([filePath]);
    if (error) throw error;
  },

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
};
