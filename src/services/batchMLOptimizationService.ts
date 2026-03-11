import { supabase } from '@/lib/supabase';

interface UsagePattern {
  batchSize: number;
  flushInterval: number;
  queueWaitTime: number;
  apiCallsSaved: number;
  successRate: number;
  hourOfDay: number;
  dayOfWeek: number;
  totalLogsProcessed: number;
}

interface OptimizationRecommendation {
  batchSize: number;
  flushInterval: number;
  confidence: number;
  reason: string;
}

class BatchMLOptimizationService {
  private currentStrategy: string = 'default';
  
  async recordUsagePattern(pattern: UsagePattern) {
    const { error } = await supabase
      .from('batch_usage_patterns')
      .insert({
        batch_size: pattern.batchSize,
        flush_interval: pattern.flushInterval,
        queue_wait_time: pattern.queueWaitTime,
        api_calls_saved: pattern.apiCallsSaved,
        success_rate: pattern.successRate,
        hour_of_day: pattern.hourOfDay,
        day_of_week: pattern.dayOfWeek,
        total_logs_processed: pattern.totalLogsProcessed
      });

    if (error) throw error;
  }

  async getOptimalConfiguration(): Promise<OptimizationRecommendation> {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Get historical data for similar time periods
    const { data: patterns } = await supabase
      .from('batch_usage_patterns')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('hour_of_day', hour)
      .order('success_rate', { ascending: false })
      .limit(50);

    if (!patterns || patterns.length === 0) {
      return {
        batchSize: 10,
        flushInterval: 5000,
        confidence: 0.5,
        reason: 'Using default configuration (insufficient data)'
      };
    }

    // Calculate weighted averages
    const totalWeight = patterns.reduce((sum, p) => sum + p.success_rate, 0);
    const optimalBatchSize = Math.round(
      patterns.reduce((sum, p) => sum + (p.batch_size * p.success_rate), 0) / totalWeight
    );
    const optimalFlushInterval = Math.round(
      patterns.reduce((sum, p) => sum + (p.flush_interval * p.success_rate), 0) / totalWeight
    );

    const avgSuccessRate = patterns.reduce((sum, p) => sum + p.success_rate, 0) / patterns.length;

    return {
      batchSize: Math.max(5, Math.min(50, optimalBatchSize)),
      flushInterval: Math.max(2000, Math.min(30000, optimalFlushInterval)),
      confidence: avgSuccessRate / 100,
      reason: `Optimized based on ${patterns.length} similar time periods`
    };
  }

  async predictPeakUsage(hoursAhead: number = 24): Promise<Array<{ hour: number; load: number }>> {
    const { data: patterns } = await supabase
      .from('batch_usage_patterns')
      .select('hour_of_day, total_logs_processed')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!patterns) return [];

    const hourlyLoad: { [key: number]: number[] } = {};
    patterns.forEach(p => {
      if (!hourlyLoad[p.hour_of_day]) hourlyLoad[p.hour_of_day] = [];
      hourlyLoad[p.hour_of_day].push(p.total_logs_processed);
    });

    return Object.entries(hourlyLoad).map(([hour, loads]) => ({
      hour: parseInt(hour),
      load: loads.reduce((a, b) => a + b, 0) / loads.length
    })).sort((a, b) => b.load - a.load);
  }

  setStrategy(strategy: string) {
    this.currentStrategy = strategy;
  }

  getCurrentStrategy(): string {
    return this.currentStrategy;
  }
}

export const batchMLOptimizationService = new BatchMLOptimizationService();
