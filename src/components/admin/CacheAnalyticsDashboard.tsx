import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Database, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  hourlyHits: Array<{ hour: string; hits: number; misses: number }>;
  avgResponseTimes: Array<{ source: string; avgTime: number }>;
  topQueries: Array<{ query: string; count: number }>;
  summary: {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    avgCacheTime: number;
    avgApiTime: number;
  };
}

export default function CacheAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: analytics } = await supabase
        .from('image_cache_analytics')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (!analytics) return;

      // Process hourly hits
      const hourlyMap = new Map();
      analytics.forEach(a => {
        const hour = new Date(a.created_at).getHours();
        const key = `${hour}:00`;
        if (!hourlyMap.has(key)) {
          hourlyMap.set(key, { hour: key, hits: 0, misses: 0 });
        }
        const entry = hourlyMap.get(key);
        if (a.event_type === 'hit') entry.hits++;
        if (a.event_type === 'miss') entry.misses++;
      });

      // Calculate averages
      const cacheResponses = analytics.filter(a => a.source === 'cache' && a.response_time_ms);
      const apiResponses = analytics.filter(a => a.source === 'google_api' && a.response_time_ms);

      const avgCacheTime = cacheResponses.length > 0
        ? cacheResponses.reduce((sum, a) => sum + a.response_time_ms, 0) / cacheResponses.length
        : 0;

      const avgApiTime = apiResponses.length > 0
        ? apiResponses.reduce((sum, a) => sum + a.response_time_ms, 0) / apiResponses.length
        : 0;

      // Top queries
      const queryMap = new Map();
      analytics.forEach(a => {
        queryMap.set(a.search_query, (queryMap.get(a.search_query) || 0) + 1);
      });

      const totalHits = analytics.filter(a => a.event_type === 'hit').length;
      const totalMisses = analytics.filter(a => a.event_type === 'miss').length;

      setData({
        hourlyHits: Array.from(hourlyMap.values()),
        avgResponseTimes: [
          { source: 'Cache', avgTime: Math.round(avgCacheTime) },
          { source: 'Google API', avgTime: Math.round(avgApiTime) }
        ],
        topQueries: Array.from(queryMap.entries())
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        summary: {
          totalHits,
          totalMisses,
          hitRate: totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0,
          avgCacheTime: Math.round(avgCacheTime),
          avgApiTime: Math.round(avgApiTime)
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.hitRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cache Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgCacheTime}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">API Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgApiTime}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Speedup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.summary.avgApiTime / data.summary.avgCacheTime).toFixed(1)}x
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Hits vs Misses (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hourlyHits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hits" fill="#10b981" name="Cache Hits" />
              <Bar dataKey="misses" fill="#ef4444" name="Cache Misses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Time Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.avgResponseTimes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="source" />
              <Tooltip />
              <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
