import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { translationProviderService, TranslationProvider, ProviderMetrics } from '@/services/translationProviderService';
import { Activity, TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TranslationProviderDashboard() {
  const [providers, setProviders] = useState<TranslationProvider[]>([]);
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [failovers, setFailovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersData, metricsData, failoversData] = await Promise.all([
        translationProviderService.getProviders(),
        translationProviderService.getProviderMetrics(),
        translationProviderService.getFailoverHistory(50)
      ]);

      setProviders(providersData);
      setMetrics(metricsData);
      setFailovers(failoversData);
    } catch (error) {
      console.error('Error loading provider data:', error);
      toast.error('Failed to load provider data');
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (id: string, enabled: boolean) => {
    try {
      await translationProviderService.updateProvider(id, { is_enabled: enabled });
      toast.success(`Provider ${enabled ? 'enabled' : 'disabled'}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update provider');
    }
  };

  const getProviderMetrics = (providerId: string) => {
    return metrics.filter(m => m.provider_id === providerId);
  };

  const getProviderStats = (providerId: string) => {
    const providerMetrics = getProviderMetrics(providerId);
    const totalRequests = providerMetrics.reduce((sum, m) => sum + m.total_requests, 0);
    const totalCost = providerMetrics.reduce((sum, m) => sum + m.total_cost, 0);
    const avgSuccessRate = providerMetrics.length > 0
      ? providerMetrics.reduce((sum, m) => sum + m.success_rate, 0) / providerMetrics.length
      : 0;
    const avgResponseTime = providerMetrics.length > 0
      ? providerMetrics.reduce((sum, m) => sum + m.avg_response_time_ms, 0) / providerMetrics.length
      : 0;

    return { totalRequests, totalCost, avgSuccessRate, avgResponseTime };
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Translation Providers</h2>
        <p className="text-muted-foreground">
          Manage and monitor translation service providers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map(provider => {
          const stats = getProviderStats(provider.id);
          const providerFailovers = failovers.filter(
            f => f.original_provider_id === provider.id
          );

          return (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  <Switch
                    checked={provider.is_enabled}
                    onCheckedChange={(checked) => toggleProvider(provider.id, checked)}
                  />
                </div>
                <CardDescription>
                  <Badge variant={provider.provider_type === 'openai' ? 'default' : 'secondary'}>
                    {provider.provider_type.toUpperCase()}
                  </Badge>
                  <span className="ml-2">Priority: {provider.priority}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Activity className="h-4 w-4 mr-1" />
                      Requests
                    </div>
                    <div className="text-2xl font-bold">{stats.totalRequests}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Total Cost
                    </div>
                    <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Success Rate
                    </div>
                    <div className="text-2xl font-bold">{stats.avgSuccessRate.toFixed(1)}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      Avg Time
                    </div>
                    <div className="text-2xl font-bold">{stats.avgResponseTime.toFixed(0)}ms</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost per 1K chars</span>
                    <span className="font-medium">${provider.cost_per_1k_chars}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Quality Score</span>
                    <span className="font-medium">{provider.quality_score}/1.0</span>
                  </div>
                  {providerFailovers.length > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
                        Failovers
                      </span>
                      <span className="font-medium text-orange-500">
                        {providerFailovers.length}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
