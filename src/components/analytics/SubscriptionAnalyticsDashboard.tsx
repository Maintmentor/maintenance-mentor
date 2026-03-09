import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { SubscriptionMetricsCards } from './SubscriptionMetricsCards';
import { RevenueGrowthChart } from './RevenueGrowthChart';
import { PlanDistributionChart } from './PlanDistributionChart';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Call the edge function to get analytics
      const { data, error } = await supabase.functions.invoke('subscription-analytics-processor', {
        body: { action: 'calculate', startDate, endDate }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to load analytics');
      }

      if (!data) {
        throw new Error('No data returned from analytics processor');
      }

      // Generate mock historical data for charts
      const historicalData = Array.from({ length: 12 }, (_, i) => ({
        date: format(new Date(2024, i, 1), 'MMM yyyy'),
        mrr: parseFloat(data.mrr || 0) * (0.7 + (i * 0.03)),
        subscribers: Math.floor((data.totalSubscribers || 0) * (0.6 + (i * 0.04)))
      }));

      const planData = Object.entries(data.planDistribution || {}).map(([name, info]: [string, any]) => ({
        name,
        value: info.count || 0,
        revenue: info.revenue || 0
      }));

      setMetrics({
        mrr: data.mrr || '0.00',
        arr: data.arr || '0.00',
        totalSubscribers: data.totalSubscribers || 0,
        avgCLV: data.avgCLV || '0.00',
        paymentSuccessRate: data.paymentSuccessRate || '100.00',
        historicalData,
        planData,
        churnRate: 5.2 // Mock churn rate
      });
    } catch (error: any) {
      console.error('Analytics error:', error);
      toast({
        title: 'Error Loading Analytics',
        description: error.message || 'Failed to load subscription analytics. Please try again.',
        variant: 'destructive'
      });
      
      // Set default values so the dashboard still renders
      setMetrics({
        mrr: '0.00',
        arr: '0.00',
        totalSubscribers: 0,
        avgCLV: '0.00',
        paymentSuccessRate: '100.00',
        historicalData: [],
        planData: [],
        churnRate: 0
      });
    } finally {
      setLoading(false);
    }
  };


  const exportReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-analytics-processor', {
        body: { action: 'export', startDate, endDate }
      });

      if (error) throw error;

      const csvContent = `Subscription Analytics Report
Generated: ${format(new Date(), 'PPP')}
MRR: $${metrics.mrr}
ARR: $${metrics.arr}
Total Subscribers: ${metrics.totalSubscribers}
Avg CLV: $${metrics.avgCLV}
Churn Rate: ${metrics.churnRate}%
Payment Success Rate: ${metrics.paymentSuccessRate}%`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscription-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();

      toast({
        title: 'Success',
        description: 'Report exported successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subscription Analytics</h1>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PP') : 'Start Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PP') : 'End Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
            </PopoverContent>
          </Popover>
          <Button onClick={loadAnalytics}>Apply Filters</Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <SubscriptionMetricsCards
        mrr={parseFloat(metrics.mrr)}
        arr={parseFloat(metrics.arr)}
        totalSubscribers={metrics.totalSubscribers}
        avgCLV={parseFloat(metrics.avgCLV)}
        churnRate={metrics.churnRate}
        paymentSuccessRate={parseFloat(metrics.paymentSuccessRate)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueGrowthChart data={metrics.historicalData} />
        <PlanDistributionChart data={metrics.planData} />
      </div>
    </div>
  );
}
