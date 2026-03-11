import { supabase } from '@/lib/supabase';

export interface TrialMetrics {
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  convertedTrials: number;
  conversionRate: number;
  averageDaysToConversion: number;
  totalRevenue: number;
  cancelledTrials: number;
}

export interface ConversionTrend {
  date: string;
  conversions: number;
  trials: number;
  conversionRate: number;
}

export interface RevenueByPlan {
  plan: string;
  revenue: number;
  conversions: number;
}

export const trialAnalyticsService = {
  async getTrialMetrics(startDate?: Date, endDate?: Date): Promise<TrialMetrics> {
    let query = supabase.from('trial_analytics').select('*');
    
    if (startDate) {
      query = query.gte('trial_start_date', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('trial_start_date', endDate.toISOString());
    }

    const { data, error } = await query;
    
    if (error) throw error;

    const now = new Date();
    const totalTrials = data?.length || 0;
    const convertedTrials = data?.filter(t => t.converted_to_paid).length || 0;
    const activeTrials = data?.filter(t => 
      new Date(t.trial_end_date) > now && !t.converted_to_paid
    ).length || 0;
    const expiredTrials = data?.filter(t => 
      new Date(t.trial_end_date) <= now && !t.converted_to_paid
    ).length || 0;
    const cancelledTrials = data?.filter(t => t.cancellation_date).length || 0;

    const conversions = data?.filter(t => t.days_to_conversion) || [];
    const avgDays = conversions.length > 0
      ? conversions.reduce((sum, t) => sum + (t.days_to_conversion || 0), 0) / conversions.length
      : 0;

    const totalRevenue = data?.reduce((sum, t) => sum + (parseFloat(t.revenue_amount as any) || 0), 0) || 0;

    return {
      totalTrials,
      activeTrials,
      expiredTrials,
      convertedTrials,
      conversionRate: totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0,
      averageDaysToConversion: avgDays,
      totalRevenue,
      cancelledTrials,
    };
  },

  async getConversionTrends(days: number = 30): Promise<ConversionTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('trial_analytics')
      .select('*')
      .gte('trial_start_date', startDate.toISOString());

    if (error) throw error;

    const trendMap = new Map<string, { conversions: number; trials: number }>();

    data?.forEach(trial => {
      const date = new Date(trial.trial_start_date).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { conversions: 0, trials: 0 };
      existing.trials += 1;
      if (trial.converted_to_paid) existing.conversions += 1;
      trendMap.set(date, existing);
    });

    return Array.from(trendMap.entries())
      .map(([date, stats]) => ({
        date,
        conversions: stats.conversions,
        trials: stats.trials,
        conversionRate: (stats.conversions / stats.trials) * 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async getRevenueByPlan(): Promise<RevenueByPlan[]> {
    const { data, error } = await supabase
      .from('trial_analytics')
      .select('*')
      .eq('converted_to_paid', true);

    if (error) throw error;

    const planMap = new Map<string, { revenue: number; conversions: number }>();

    data?.forEach(trial => {
      const plan = trial.subscription_plan || 'Unknown';
      const existing = planMap.get(plan) || { revenue: 0, conversions: 0 };
      existing.revenue += parseFloat(trial.revenue_amount as any) || 0;
      existing.conversions += 1;
      planMap.set(plan, existing);
    });

    return Array.from(planMap.entries()).map(([plan, stats]) => ({
      plan,
      revenue: stats.revenue,
      conversions: stats.conversions,
    }));
  },

  exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
