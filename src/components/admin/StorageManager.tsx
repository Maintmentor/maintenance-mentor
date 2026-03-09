import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Database, HardDrive, Trash2, RefreshCw, FolderOpen, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storageService, BucketInfo, StorageStats, RecentFile } from '@/services/storageService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StorageManager() {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [stats, setStats] = useState<StorageStats[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    setLoading(true);
    try {
      const [bucketsData, statsData, filesData] = await Promise.all([
        storageService.getBuckets(),
        storageService.getStorageStats(),
        storageService.getRecentFiles(50)
      ]);
      setBuckets(bucketsData);
      setStats(statsData);
      setRecentFiles(filesData);
    } catch (error) {
      console.error('Error loading storage data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load storage data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldFiles = async (bucketId: string, days: number) => {
    try {
      const count = await storageService.cleanupOldFiles(bucketId, days);
      toast({
        title: 'Success',
        description: `Deleted ${count} files older than ${days} days`
      });
      loadStorageData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cleanup files',
        variant: 'destructive'
      });
    }
  };

  const getTotalStorage = () => stats.reduce((acc, s) => acc + s.total_size, 0);
  const getTotalFiles = () => stats.reduce((acc, s) => acc + s.file_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Storage Manager</h2>
          <p className="text-muted-foreground">Manage buckets, monitor usage, and cleanup files</p>
        </div>
        <Button onClick={loadStorageData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Manage your Supabase storage buckets. See SUPABASE_STORAGE_SETUP_GUIDE.md for RLS policies and configuration.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Buckets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold">{buckets.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold">{getTotalFiles()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold">{storageService.formatBytes(getTotalStorage())}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Public Buckets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Upload className="w-8 h-8 text-orange-500" />
              <span className="text-3xl font-bold">{buckets.filter(b => b.public).length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="buckets">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="recent">Recent Uploads</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="buckets" className="space-y-4">
          {buckets.map((bucket) => {
            const bucketStats = stats.find(s => s.bucket_id === bucket.id);
            return (
              <Card key={bucket.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {bucket.name}
                        <Badge variant={bucket.public ? 'default' : 'secondary'}>
                          {bucket.public ? 'Public' : 'Private'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Created: {new Date(bucket.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Files</p>
                      <p className="text-2xl font-bold">{bucketStats?.file_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Size</p>
                      <p className="text-2xl font-bold">
                        {storageService.formatBytes(bucketStats?.total_size || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg File Size</p>
                      <p className="text-2xl font-bold">
                        {storageService.formatBytes(bucketStats?.avg_size || 0)}
                      </p>
                    </div>
                  </div>
                  
                  {bucketStats && bucketStats.total_size > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage Usage</span>
                        <span>{((bucketStats.total_size / (1024 * 1024 * 1024)) * 100).toFixed(2)}% of 1GB</span>
                      </div>
                      <Progress value={Math.min((bucketStats.total_size / (1024 * 1024 * 1024)) * 100, 100)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>Last 50 files uploaded across all buckets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {recentFiles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recent uploads</p>
                ) : (
                  recentFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.bucket_id} • {file.mime_type}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium">{storageService.formatBytes(file.size)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(file.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup">
          <Card>
            <CardHeader>
              <CardTitle>Cleanup Tools</CardTitle>
              <CardDescription>Remove old or unused files to free up storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buckets.map((bucket) => (
                <div key={bucket.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{bucket.name}</h3>
                    <Badge variant={bucket.public ? 'default' : 'secondary'}>
                      {bucket.public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cleanupOldFiles(bucket.id, 30)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete 30+ days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cleanupOldFiles(bucket.id, 90)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete 90+ days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cleanupOldFiles(bucket.id, 180)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete 180+ days
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
