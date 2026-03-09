import { supabase } from '@/lib/supabase';
import { AnalyticsFilters, PartTypeAnalysis, FeedbackTrend } from './imageQualityAnalyticsService';

export const imageQualityAnalyticsService2 = {
  async getProblematicParts(filters: AnalyticsFilters = {}): Promise<PartTypeAnalysis[]> {
    try {
      let query = supabase.from('image_quality_feedback')
        .select('part_number, feedback_type');
      
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data?.reduce((acc: any, item) => {
        if (!acc[item.part_number]) {
          acc[item.part_number] = { positive: 0, negative: 0 };
        }
        if (item.feedback_type === 'positive') acc[item.part_number].positive++;
        else acc[item.part_number].negative++;
        return acc;
      }, {});

      return Object.entries(grouped || {}).map(([part, counts]: [string, any]) => ({
        part_number: part,
        total_feedback: counts.positive + counts.negative,
        negative_count: counts.negative,
        problem_rate: (counts.negative / (counts.positive + counts.negative)) * 100
      })).filter(p => p.negative_count > 0).sort((a, b) => b.problem_rate - a.problem_rate);
    } catch (error) {
      console.error('Error getting problematic parts:', error);
      return [];
    }
  },

  async getVerificationScoreDistribution(filters: AnalyticsFilters = {}): Promise<{ score: number; count: number }[]> {
    try {
      let query = supabase.from('image_quality_feedback')
        .select('ai_verification_score')
        .not('ai_verification_score', 'is', null);
      
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;

      const distribution = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(score => ({
        score,
        count: data?.filter(d => {
          const s = d.ai_verification_score || 0;
          return s >= score && s < score + 10;
        }).length || 0
      }));

      return distribution;
    } catch (error) {
      console.error('Error getting score distribution:', error);
      return [];
    }
  },

  async getFeedbackTrends(filters: AnalyticsFilters = {}): Promise<FeedbackTrend[]> {
    try {
      let query = supabase.from('image_quality_feedback')
        .select('created_at, feedback_type');
      
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data?.reduce((acc: any, item) => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { positive: 0, negative: 0 };
        if (item.feedback_type === 'positive') acc[date].positive++;
        else acc[date].negative++;
        return acc;
      }, {});

      return Object.entries(grouped || {}).map(([date, counts]: [string, any]) => ({
        date,
        positive: counts.positive,
        negative: counts.negative,
        accuracy_rate: (counts.positive / (counts.positive + counts.negative)) * 100
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting feedback trends:', error);
      return [];
    }
  },

  async getNegativeFeedbackImages(filters: AnalyticsFilters = {}) {
    try {
      let query = supabase.from('image_quality_feedback')
        .select('*')
        .eq('feedback_type', 'negative')
        .order('created_at', { ascending: false });
      
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting negative feedback:', error);
      return [];
    }
  }
};
