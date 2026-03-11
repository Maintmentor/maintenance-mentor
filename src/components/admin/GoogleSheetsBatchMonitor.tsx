import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { googleSheetsService } from '@/services/googleSheetsService';
import { RefreshCw, Send, Activity } from 'lucide-react';

export function GoogleSheetsBatchMonitor() {
  const [queueSize, setQueueSize] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueSize(googleSheetsService.getBatchQueueSize());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleFlush = async () => {
    setIsFlushing(true);
    try {
      await googleSheetsService.flushBatchQueue();
      setQueueSize(0);
    } catch (error) {
      console.error('Flush failed:', error);
    } finally {
      setIsFlushing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Batch Queue Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Queued Logs</p>
            <p className="text-2xl font-bold">{queueSize}</p>
          </div>
          <Badge variant={queueSize > 0 ? 'default' : 'secondary'}>
            {queueSize >= 10 ? 'Auto-flush pending' : 'Active'}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Logs are batched and sent every 5 seconds or when 10 logs accumulate.
            Failed batches retry up to 3 times with exponential backoff.
          </p>
        </div>

        <Button
          onClick={handleFlush}
          disabled={queueSize === 0 || isFlushing}
          className="w-full"
        >
          {isFlushing ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Flush Queue Now
        </Button>
      </CardContent>
    </Card>
  );
}
