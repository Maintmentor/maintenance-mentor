import { supabase } from '@/lib/supabase';

export interface UserQueryStats {
  user_id: string;
  user_email: string;
  total_queries: number;
  last_query: string;
  sheet_id: string;
}

export interface QueryTrend {
  date: string;
  count: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface SheetHealthMetric {
  user_id: string;
  user_email: string;
  sheet_id: string;
  last_updated: string;
  row_count: number;
  status: 'healthy' | 'warning' | 'error';
}

export const googleSheetsAnalyticsService = {
  async getTotalQueriesPerUser(): Promise<UserQueryStats[]> {
    const { data: sheets, error: sheetsError } = await supabase
      .from('user_google_sheets')
      .select('user_id, sheet_id, created_at');

    if (sheetsError) throw sheetsError;

    const stats: UserQueryStats[] = [];
    
    for (const sheet of sheets || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', sheet.user_id)
        .single();

      // Mock query count - in real implementation, track in database
      const queryCount = Math.floor(Math.random() * 100) + 10;
      
      stats.push({
        user_id: sheet.user_id,
        user_email: profile?.email || 'Unknown',
        total_queries: queryCount,
        last_query: new Date().toISOString(),
        sheet_id: sheet.sheet_id
      });
    }

    return stats.sort((a, b) => b.total_queries - a.total_queries);
  },

  async getQueryTrends(days: number = 30): Promise<QueryTrend[]> {
    const trends: QueryTrend[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 10
      });
    }

    return trends;
  },

  async getCategoryBreakdown(): Promise<CategoryStats[]> {
    const categories = [
      'Plumbing',
      'Electrical',
      'HVAC',
      'Appliances',
      'General Maintenance',
      'Pool/Spa',
      'Other'
    ];

    const stats = categories.map(category => ({
      category,
      count: Math.floor(Math.random() * 200) + 50,
      percentage: 0
    }));

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => s.percentage = (s.count / total) * 100);

    return stats.sort((a, b) => b.count - a.count);
  },

  async getSheetHealthMetrics(): Promise<SheetHealthMetric[]> {
    const { data: sheets, error } = await supabase
      .from('user_google_sheets')
      .select('user_id, sheet_id, updated_at');

    if (error) throw error;

    const metrics: SheetHealthMetric[] = [];

    for (const sheet of sheets || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', sheet.user_id)
        .single();

      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(sheet.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      if (daysSinceUpdate > 30) status = 'error';
      else if (daysSinceUpdate > 7) status = 'warning';

      metrics.push({
        user_id: sheet.user_id,
        user_email: profile?.email || 'Unknown',
        sheet_id: sheet.sheet_id,
        last_updated: sheet.updated_at,
        row_count: Math.floor(Math.random() * 500) + 50,
        status
      });
    }

    return metrics;
  },

  async getAverageResponseTime(): Promise<number> {
    // Mock average response time in seconds
    return 2.3;
  },

  async exportAnalyticsReport(): Promise<Blob> {
    const [users, trends, categories, health] = await Promise.all([
      this.getTotalQueriesPerUser(),
      this.getQueryTrends(),
      this.getCategoryBreakdown(),
      this.getSheetHealthMetrics()
    ]);

    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_users: users.length,
        total_queries: users.reduce((sum, u) => sum + u.total_queries, 0),
        average_queries_per_user: users.reduce((sum, u) => sum + u.total_queries, 0) / users.length
      },
      users,
      trends,
      categories,
      health
    };

    return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  }
};
