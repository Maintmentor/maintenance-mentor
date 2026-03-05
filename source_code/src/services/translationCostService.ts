import { supabase } from '@/lib/supabase';

export interface CostMetrics {
  languagePair: string;
  totalCost: number;
  totalRequests: number;
  cacheHitRate: number;
  costSaved: number;
  costPerTranslation: number;
}

export interface CostProjection {
  languagePair: string;
  projectedCost: number;
  confidenceLevel: number;
  projectionDate: string;
}

export interface CostAlert {
  id: string;
  alertType: string;
  thresholdAmount: number;
  currentAmount: number;
  period: string;
  languagePair?: string;
  triggeredAt: string;
  resolved: boolean;
}

export interface CacheRecommendation {
  id: string;
  languagePair: string;
  currentTtlHours: number;
  recommendedTtlHours: number;
  potentialSavings: number;
  confidenceScore: number;
  reason: string;
  applied: boolean;
}

export const translationCostService = {
  async analyzeCosts(days: number = 30): Promise<{ metrics: Record<string, CostMetrics> }> {
    const { data, error } = await supabase.functions.invoke('translation-cost-analyzer', {
      body: { action: 'analyze_costs', days }
    });

    if (error) throw error;
    return data;
  },

  async generateProjections(): Promise<{ projections: CostProjection[] }> {
    const { data, error } = await supabase.functions.invoke('translation-cost-analyzer', {
      body: { action: 'generate_projections' }
    });

    if (error) throw error;
    return data;
  },

  async checkAlerts(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('translation-cost-analyzer', {
      body: { action: 'check_alerts' }
    });

    if (error) throw error;
    return data;
  },

  async getCostAlerts(): Promise<CostAlert[]> {
    const { data, error } = await supabase
      .from('translation_cost_alerts')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('translation_cost_alerts')
      .update({ resolved: true })
      .eq('id', alertId);

    if (error) throw error;
  },

  async getCacheRecommendations(): Promise<CacheRecommendation[]> {
    const { data, error } = await supabase
      .from('cache_optimization_recommendations')
      .select('*')
      .eq('applied', false)
      .order('potential_savings', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async applyRecommendation(recommendationId: string): Promise<void> {
    const { error } = await supabase
      .from('cache_optimization_recommendations')
      .update({ applied: true })
      .eq('id', recommendationId);

    if (error) throw error;
  },

  async getMonthlyCostTrend(months: number = 6): Promise<any[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('translation_costs')
      .select('created_at, api_cost, cache_hit')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Group by month
    const monthlyData: Record<string, { cost: number; requests: number; cacheHits: number }> = {};
    
    data?.forEach((record: any) => {
      const month = new Date(record.created_at).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { cost: 0, requests: 0, cacheHits: 0 };
      }
      monthlyData[month].cost += parseFloat(record.api_cost);
      monthlyData[month].requests++;
      if (record.cache_hit) monthlyData[month].cacheHits++;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      cost: data.cost,
      requests: data.requests,
      cacheHitRate: (data.cacheHits / data.requests) * 100
    }));
  }
};
