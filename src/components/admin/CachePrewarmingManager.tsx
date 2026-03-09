import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, X, Loader2 } from 'lucide-react';
import { imageCacheService } from '@/services/imageCacheService';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_QUERIES = [
  'water heater thermostat',
  'furnace air filter',
  'toilet fill valve',
  'faucet cartridge',
  'circuit breaker',
  'smoke detector battery',
  'door lock cylinder',
  'light switch dimmer',
  'GFCI outlet',
  'HVAC capacitor'
];

export default function CachePrewarmingManager() {
  const [queries, setQueries] = useState<string[]>(DEFAULT_QUERIES);
  const [newQuery, setNewQuery] = useState('');
  const [prewarming, setPrewarming] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const addQuery = () => {
    if (newQuery.trim() && !queries.includes(newQuery.trim())) {
      setQueries([...queries, newQuery.trim()]);
      setNewQuery('');
    }
  };

  const removeQuery = (index: number) => {
    setQueries(queries.filter((_, i) => i !== index));
  };

  const prewarmCache = async () => {
    setPrewarming(true);
    setProgress({ current: 0, total: queries.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < queries.length; i++) {
      try {
        await imageCacheService.getImage(queries[i]);
        successCount++;
        setProgress({ current: i + 1, total: queries.length });
        
        // Wait 1 second between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failCount++;
      }
    }

    setPrewarming(false);
    toast({
      title: 'Prewarming Complete',
      description: `${successCount} cached, ${failCount} failed`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Cache Prewarming
        </CardTitle>
        <CardDescription>
          Prewarm the cache with popular search queries for faster initial loads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add query to prewarm..."
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addQuery()}
          />
          <Button onClick={addQuery} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {queries.map((query, index) => (
            <Badge key={index} variant="secondary" className="gap-2">
              {query}
              <button onClick={() => removeQuery(index)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>

        <Button 
          onClick={prewarmCache} 
          disabled={prewarming || queries.length === 0}
          className="w-full"
        >
          {prewarming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Prewarming {progress.current}/{progress.total}...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Prewarm {queries.length} Queries
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
