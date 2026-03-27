import { supabase } from '@/lib/supabase';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  partCategory?: string;
  source?: string;
}

export interface QueryPerformance {
  search_query: string;
  total_feedback: number;
  positive_count: number;
  negative_count: number;
  accuracy_rate: number;
}

export interface PartTypeAnalysis {
  part_number: string;
  total_feedback: number;
  negative_count: number;
  problem_rate: number;
}

export interface FeedbackTrend {
  date: string;
  positive: number;
  negative: number;
  accuracy_rate: number;
}

export const imageQualityAnalyticsService = {
  async getOverallAccuracy(filters: AnalyticsFilters = {}): Promise<number> {
    try {
      let query = supabase.from('image_quality_feedback').select('feedback_type');
      
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return 0;

      const positive = data.filter(f => f.feedback_type === 'positive').length;
      return (positive / data.length) * 100;
    } catch (error) {
      console.error('Error getting overall accuracy:', error);
      return 0;
    }
  },

  async getQueryPerformance(filters: AnalyticsFilters = {}): Promise<QueryPerformance[]> {
    try {
      let query = supabase.from('image_quality_feedback')
        .select('search_query, feedback_type');
      
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data?.reduce((acc: any, item) => {
        if (!acc[item.search_query]) {
          acc[item.search_query] = { positive: 0, negative: 0 };
        }
        if (item.feedback_type === 'positive') acc[item.search_query].positive++;
        else acc[item.search_query].negative++;
        return acc;
      }, {});

      return Object.entries(grouped || {}).map(([query, counts]: [string, any]) => ({
        search_query: query,
        total_feedback: counts.positive + counts.negative,
        positive_count: counts.positive,
        negative_count: counts.negative,
        accuracy_rate: (counts.positive / (counts.positive + counts.negative)) * 100
      })).sort((a, b) => b.total_feedback - a.total_feedback);
    } catch (error) {
      console.error('Error getting query performance:', error);
      return [];
    }
  }
};
