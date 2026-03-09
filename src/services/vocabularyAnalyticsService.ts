import { supabase } from '@/lib/supabase';

export interface VocabularyAnalytics {
  totalTerms: number;
  masteredTerms: number;
  inProgressTerms: number;
  newTerms: number;
  retentionRate: number;
  averageResponseTime: number;
  difficultyProgression: DifficultyProgress[];
  categoryMastery: CategoryMastery[];
  learningVelocity: LearningVelocityData[];
  weeklyProgress: WeeklyProgress[];
  recommendations: string[];
}

export interface DifficultyProgress {
  level: string;
  mastered: number;
  total: number;
  percentage: number;
}

export interface CategoryMastery {
  category: string;
  mastered: number;
  total: number;
  percentage: number;
  averageTime: number;
}

export interface LearningVelocityData {
  date: string;
  newTerms: number;
  masteredTerms: number;
  practiceTime: number;
}

export interface WeeklyProgress {
  week: string;
  studied: number;
  mastered: number;
  accuracy: number;
}
class VocabularyAnalyticsService {
  async trackAction(
    termId: string,
    actionType: 'viewed' | 'practiced' | 'mastered' | 'reviewed',
    metadata: {
      difficultyLevel?: string;
      category?: string;
      equipmentType?: string;
      responseTime?: number;
      correctAnswer?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .from('vocabulary_analytics')
        .insert({
          user_id: user.id,
          term_id: termId,
          action_type: actionType,
          difficulty_level: metadata.difficultyLevel,
          category: metadata.category,
          equipment_type: metadata.equipmentType,
          response_time: metadata.responseTime,
          correct_answer: metadata.correctAnswer
        });
    } catch (error) {
      console.error('Error tracking vocabulary action:', error);
    }
  }

  async getAnalytics(dateRange: string = '30days'): Promise<VocabularyAnalytics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dateFilter = this.getDateFilter(dateRange);

      // Get vocabulary terms
      const { data: terms, error: termsError } = await supabase
        .from('vocabulary_terms')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter);

      if (termsError) throw termsError;

      // Get analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('vocabulary_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter);

      if (analyticsError) throw analyticsError;

      return this.processAnalytics(terms || [], analytics || []);
    } catch (error) {
      console.error('Error getting vocabulary analytics:', error);
      // Return default analytics if there's an error
      return {
        totalTerms: 0,
        masteredTerms: 0,
        inProgressTerms: 0,
        newTerms: 0,
        retentionRate: 0,
        averageResponseTime: 0,
        difficultyProgression: [],
        categoryMastery: [],
        learningVelocity: [],
        weeklyProgress: [],
        recommendations: ['Start adding vocabulary terms to see analytics!']
      };
    }
  }
  private getDateFilter(range: string): string {
    const now = new Date();
    switch (range) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private processAnalytics(terms: any[], analytics: any[]): VocabularyAnalytics {
    const totalTerms = terms.length;
    const masteredTerms = terms.filter(t => t.mastery_level === 'mastered').length;
    const inProgressTerms = terms.filter(t => t.mastery_level === 'learning').length;
    const newTerms = terms.filter(t => t.mastery_level === 'new').length;

    // Calculate retention rate
    const practiceActions = analytics.filter(a => a.action_type === 'practiced');
    const correctAnswers = practiceActions.filter(a => a.correct_answer).length;
    const retentionRate = practiceActions.length > 0 ? (correctAnswers / practiceActions.length) * 100 : 0;

    // Calculate average response time
    const responseTimeActions = analytics.filter(a => a.response_time);
    const averageResponseTime = responseTimeActions.length > 0 
      ? responseTimeActions.reduce((sum, a) => sum + a.response_time, 0) / responseTimeActions.length
      : 0;

    return {
      totalTerms,
      masteredTerms,
      inProgressTerms,
      newTerms,
      retentionRate: Math.round(retentionRate),
      averageResponseTime: Math.round(averageResponseTime),
      difficultyProgression: this.calculateDifficultyProgression(terms),
      categoryMastery: this.calculateCategoryMastery(terms, analytics),
      learningVelocity: this.calculateLearningVelocity(analytics),
      weeklyProgress: this.calculateWeeklyProgress(analytics),
      recommendations: this.generateRecommendations(terms, analytics)
    };
  }

  private calculateDifficultyProgression(terms: any[]): DifficultyProgress[] {
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    return difficulties.map(level => {
      const levelTerms = terms.filter(t => t.difficulty_level === level);
      const mastered = levelTerms.filter(t => t.mastery_level === 'mastered').length;
      return {
        level,
        mastered,
        total: levelTerms.length,
        percentage: levelTerms.length > 0 ? Math.round((mastered / levelTerms.length) * 100) : 0
      };
    });
  }

  private calculateCategoryMastery(terms: any[], analytics: any[]): CategoryMastery[] {
    const categories = [...new Set(terms.map(t => t.category))];
    return categories.map(category => {
      const categoryTerms = terms.filter(t => t.category === category);
      const mastered = categoryTerms.filter(t => t.mastery_level === 'mastered').length;
      const categoryAnalytics = analytics.filter(a => a.category === category && a.response_time);
      const averageTime = categoryAnalytics.length > 0
        ? categoryAnalytics.reduce((sum, a) => sum + a.response_time, 0) / categoryAnalytics.length
        : 0;

      return {
        category,
        mastered,
        total: categoryTerms.length,
        percentage: categoryTerms.length > 0 ? Math.round((mastered / categoryTerms.length) * 100) : 0,
        averageTime: Math.round(averageTime)
      };
    });
  }

  private calculateLearningVelocity(analytics: any[]): LearningVelocityData[] {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayAnalytics = analytics.filter(a => a.created_at.startsWith(date));
      const newTerms = dayAnalytics.filter(a => a.action_type === 'viewed').length;
      const masteredTerms = dayAnalytics.filter(a => a.action_type === 'mastered').length;
      const practiceTime = dayAnalytics.filter(a => a.response_time).length;

      return {
        date,
        newTerms,
        masteredTerms,
        practiceTime
      };
    });
  }

  private calculateWeeklyProgress(analytics: any[]): WeeklyProgress[] {
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      return `Week ${4 - i}`;
    });

    return last4Weeks.map((week, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - ((3 - index) * 7 + 7));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - ((3 - index) * 7));

      const weekAnalytics = analytics.filter(a => {
        const actionDate = new Date(a.created_at);
        return actionDate >= weekStart && actionDate < weekEnd;
      });

      const studied = weekAnalytics.filter(a => a.action_type === 'practiced').length;
      const mastered = weekAnalytics.filter(a => a.action_type === 'mastered').length;
      const practiceActions = weekAnalytics.filter(a => a.action_type === 'practiced');
      const correctAnswers = practiceActions.filter(a => a.correct_answer).length;
      const accuracy = practiceActions.length > 0 ? (correctAnswers / practiceActions.length) * 100 : 0;

      return {
        week,
        studied,
        mastered,
        accuracy: Math.round(accuracy)
      };
    });
  }

  private generateRecommendations(terms: any[], analytics: any[]): string[] {
    const recommendations: string[] = [];

    // Check for difficult categories
    const categoryMastery = this.calculateCategoryMastery(terms, analytics);
    const difficultCategories = categoryMastery.filter(c => c.percentage < 50 && c.total > 3);
    if (difficultCategories.length > 0) {
      recommendations.push(`Focus more practice on ${difficultCategories[0].category} terms - current mastery is ${difficultCategories[0].percentage}%`);
    }

    // Check response time
    const responseTimeActions = analytics.filter(a => a.response_time);
    const averageResponseTime = responseTimeActions.length > 0 
      ? responseTimeActions.reduce((sum, a) => sum + a.response_time, 0) / responseTimeActions.length
      : 0;
    
    if (averageResponseTime > 5000) {
      recommendations.push('Try to improve response speed - aim for under 5 seconds per term');
    }

    // Check retention rate
    const practiceActions = analytics.filter(a => a.action_type === 'practiced');
    const correctAnswers = practiceActions.filter(a => a.correct_answer).length;
    const retentionRate = practiceActions.length > 0 ? (correctAnswers / practiceActions.length) * 100 : 0;
    
    if (retentionRate < 70) {
      recommendations.push('Review previously learned terms more frequently to improve retention');
    }

    // Check daily practice
    const recentDays = analytics.filter(a => {
      const actionDate = new Date(a.created_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return actionDate >= threeDaysAgo;
    });

    if (recentDays.length < 5) {
      recommendations.push('Try to practice vocabulary daily for better learning outcomes');
    }

    return recommendations.length > 0 ? recommendations : ['Great job! Keep up the consistent practice.'];
  }
}

export const vocabularyAnalyticsService = new VocabularyAnalyticsService();