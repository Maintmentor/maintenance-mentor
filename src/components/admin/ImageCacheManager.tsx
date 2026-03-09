import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, TrendingUp, Database, Zap, Clock } from 'lucide-react';
import { imageCacheService, CacheAnalytics } from '@/services/imageCacheService';
import { useToast } from '@/hooks/use-toast';

export function ImageCacheManager() {
  const [stats, setStats] = useState<CacheAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await imageCacheService.getCacheStats();
      setStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cache statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearExpired = async () => {
    try {
      const count = await imageCacheService.clearExpiredCache();
      toast({
        title: 'Success',
        description: `Cleared ${count} expired cache entries`
      });
      loadStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear expired cache',
        variant: 'destructive'
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center py-8">Loading cache statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Image Cache Manager</h2>
          <p className="text-muted-foreground">Monitor and manage cached product images</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStats} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={clearExpired} variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Expired
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cached Images</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(stats?.totalStorageUsed || 0)} used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalHits} hits / {stats?.totalMisses} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Calls Saved</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHits || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Google API requests</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Cached Queries</CardTitle>
          <CardDescription>Most frequently accessed product images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.topQueries.map((query, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <span className="font-medium">{query.query}</span>
                </div>
                <Badge>{query.hits} hits</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
