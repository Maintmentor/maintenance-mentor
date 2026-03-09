import { supabase } from '@/lib/supabase';

export interface CachedImage {
  id: string;
  searchQuery: string;
  imageUrl: string;
  cachedUrl: string;
  cacheKey: string;
  hitCount: number;
  lastAccessedAt: string;
  createdAt: string;
  expiresAt: string;
  fileSize?: number;
}

export interface CacheAnalytics {
  totalImages: number;
  totalHits: number;
  totalMisses: number;
  cacheHitRate: number;
  totalStorageUsed: number;
  avgResponseTime: number;
  topQueries: Array<{ query: string; hits: number }>;
}

class ImageCacheService {
  /**
   * Get or fetch an image with caching
   */
  async getImage(searchQuery: string, forceRefresh = false): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('image-cache-handler', {
        body: { searchQuery, forceRefresh }
      });

      if (error) throw error;
      return data.imageUrl;
    } catch (error) {
      console.error('Image cache error:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheAnalytics> {
    try {
      // Get total images and storage
      const { data: images } = await supabase
        .from('image_cache')
        .select('hit_count, file_size')
        .eq('is_active', true);

      // Get analytics data
      const { data: analytics } = await supabase
        .from('image_cache_analytics')
        .select('event_type, response_time_ms, search_query')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const totalImages = images?.length || 0;
      const totalHits = analytics?.filter(a => a.event_type === 'hit').length || 0;
      const totalMisses = analytics?.filter(a => a.event_type === 'miss').length || 0;
      const totalStorageUsed = images?.reduce((sum, img) => sum + (img.file_size || 0), 0) || 0;
      
      const responseTimes = analytics?.filter(a => a.response_time_ms).map(a => a.response_time_ms) || [];
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      // Top queries
      const queryMap = new Map<string, number>();
      images?.forEach(img => {
        queryMap.set(img.search_query, img.hit_count);
      });
      const topQueries = Array.from(queryMap.entries())
        .map(([query, hits]) => ({ query, hits }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10);

      return {
        totalImages,
        totalHits,
        totalMisses,
        cacheHitRate: totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0,
        totalStorageUsed,
        avgResponseTime: Math.round(avgResponseTime),
        topQueries
      };
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      throw error;
    }
  }

  /**
   * Get all cached images
   */
  async getCachedImages(limit = 50): Promise<CachedImage[]> {
    const { data, error } = await supabase
      .from('image_cache')
      .select('*')
      .eq('is_active', true)
      .order('hit_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    const { data } = await supabase
      .from('image_cache')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select();

    return data?.length || 0;
  }

  /**
   * Manually delete a cached image
   */
  async deleteCachedImage(cacheKey: string): Promise<void> {
    const { error } = await supabase
      .from('image_cache')
      .update({ is_active: false })
      .eq('cache_key', cacheKey);

    if (error) throw error;
  }

  /**
   * Refresh a cached image
   */
  async refreshImage(searchQuery: string): Promise<string> {
    return this.getImage(searchQuery, true);
  }
}

export const imageCacheService = new ImageCacheService();
