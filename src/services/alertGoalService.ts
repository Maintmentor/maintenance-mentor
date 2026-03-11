import { supabase } from '@/lib/supabase';

export interface AlertPerformanceGoal {
  id: string;
  goal_type: 'response_time' | 'false_positive_rate' | 'uptime_percentage';
  target_value: number;
  created_by: string;
  created_at: string;
  active: boolean;
  notes?: string;
}

export interface GoalHistory {
  id: string;
  goal_id: string;
  goal_type: string;
  target_value: number;
  actual_value: number;
  met_goal: boolean;
  period_start: string;
  period_end: string;
  created_at: string;
}

export const alertGoalService = {
  async getActiveGoals(): Promise<AlertPerformanceGoal[]> {
    const { data, error } = await supabase
      .from('alert_performance_goals')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async setGoal(goalType: string, targetValue: number, notes?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Deactivate existing goals of same type
    await supabase
      .from('alert_performance_goals')
      .update({ active: false })
      .eq('goal_type', goalType)
      .eq('active', true);

    const { data, error } = await supabase
      .from('alert_performance_goals')
      .insert({
        goal_type: goalType,
        target_value: targetValue,
        created_by: user?.id,
        notes,
        active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGoalHistory(days: number = 30): Promise<GoalHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('alert_goal_history')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async trackGoalPerformance(
    goalType: string,
    targetValue: number,
    actualValue: number,
    periodStart: Date,
    periodEnd: Date
  ) {
    const metGoal = this.evaluateGoal(goalType, targetValue, actualValue);

    const { data, error } = await supabase
      .from('alert_goal_history')
      .insert({
        goal_type: goalType,
        target_value: targetValue,
        actual_value: actualValue,
        met_goal: metGoal,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Check for consecutive misses
    if (!metGoal) {
      await this.checkConsecutiveMisses(goalType);
    }

    return data;
  },

  evaluateGoal(goalType: string, targetValue: number, actualValue: number): boolean {
    switch (goalType) {
      case 'response_time':
        return actualValue <= targetValue;
      case 'false_positive_rate':
        return actualValue <= targetValue;
      case 'uptime_percentage':
        return actualValue >= targetValue;
      default:
        return false;
    }
  },

  async checkConsecutiveMisses(goalType: string) {
    const { data: recentHistory } = await supabase
      .from('alert_goal_history')
      .select('*')
      .eq('goal_type', goalType)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentHistory) return;

    // Check if last 3 records are all misses
    const lastThree = recentHistory.slice(0, 3);
    const consecutiveMisses = lastThree.every(h => !h.met_goal);

    if (consecutiveMisses && lastThree.length === 3) {
      // Create notification record
      const { data: notification } = await supabase
        .from('alert_goal_notifications')
        .insert({
          goal_type: goalType,
          consecutive_misses: 3,
          notification_sent: false
        })
        .select()
        .single();

      // Trigger email notification
      if (notification) {
        await this.sendGoalPerformanceEmail(notification.id);
      }
    }
  },

  async sendGoalPerformanceEmail(notificationId: string) {
    try {
      // Get admin emails
      const { data: admins } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin');

      const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];

      if (adminEmails.length === 0) {
        console.warn('No admin emails found for alert goal notification');
        return;
      }

      // Import and use email notification service
      const { emailNotificationService } = await import('./emailNotificationService');
      await emailNotificationService.sendAlertGoalPerformanceEmail(
        notificationId,
        adminEmails
      );

      // Mark notification as sent
      await this.markNotificationSent(notificationId);
    } catch (error) {
      console.error('Failed to send goal performance email:', error);
      throw error;
    }
  },


  async getUnsentNotifications() {
    const { data, error } = await supabase
      .from('alert_goal_notifications')
      .select('*')
      .eq('notification_sent', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markNotificationSent(notificationId: string) {
    const { error } = await supabase
      .from('alert_goal_notifications')
      .update({ 
        notification_sent: true,
        notification_sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  }
};
