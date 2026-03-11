import { supabase } from '@/lib/supabase';

export interface EmailNotificationRequest {
  type: 'immediate' | 'scheduled' | 'digest';
  templateType: string;
  recipientEmail: string;
  templateData: any;
  auditId?: string;
  scheduledFor?: string;
}

export interface SecurityAuditEmailData {
  domain: string;
  score: number;
  date: string;
  vulnerabilities: Array<{
    vulnerability_type: string;
    severity: string;
    description: string;
    remediation: string;
    cve_id?: string;
    cvss_score?: number;
  }>;
  recommendations: string[];
  vulnerabilityCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scoreClass: string;
}

export interface VulnerabilityAlertData {
  domain: string;
  severity: string;
  vulnerability_type: string;
  description: string;
  remediation: string;
  detected_at: string;
  date: string;
  cve_id?: string;
  cvss_score?: number;
}

export interface AlertGoalPerformanceData {
  goalType: string;
  goalTypeLabel: string;
  targetValue: number;
  currentValue: number;
  consecutiveMisses: number;
  historicalData: Array<{
    date: string;
    target: number;
    actual: number;
    met: boolean;
  }>;
  recommendations: string[];
  trend: 'improving' | 'declining' | 'stable';
  missPercentage: number;
}


class EmailNotificationService {
  async sendSecurityAuditReport(auditId: string, recipientEmails: string[]): Promise<void> {
    try {
      // Get audit data
      const { data: audit, error: auditError } = await supabase
        .from('security_audits')
        .select('*')
        .eq('id', auditId)
        .single();

      if (auditError) throw auditError;

      // Get vulnerabilities
      const { data: vulnerabilities, error: vulnError } = await supabase
        .from('vulnerability_scans')
        .select('*')
        .eq('audit_id', auditId);

      if (vulnError) throw vulnError;

      // Prepare template data
      const templateData: SecurityAuditEmailData = {
        domain: audit.domain,
        score: audit.score,
        date: new Date().toLocaleDateString(),
        vulnerabilities: vulnerabilities || [],
        recommendations: audit.recommendations || [],
        vulnerabilityCount: vulnerabilities?.length || 0,
        criticalCount: vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
        highCount: vulnerabilities?.filter(v => v.severity === 'high').length || 0,
        mediumCount: vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
        lowCount: vulnerabilities?.filter(v => v.severity === 'low').length || 0,
        scoreClass: audit.score >= 80 ? 'high' : audit.score >= 60 ? 'medium' : 'low'
      };

      // Send emails to all recipients
      for (const email of recipientEmails) {
        await this.sendEmail({
          type: 'immediate',
          templateType: 'security_audit_complete',
          recipientEmail: email,
          templateData,
          auditId
        });
      }
    } catch (error) {
      console.error('Failed to send security audit report:', error);
      throw error;
    }
  }

  async sendVulnerabilityAlert(vulnerabilityId: string, recipientEmails: string[]): Promise<void> {
    try {
      // Get vulnerability data
      const { data: vulnerability, error: vulnError } = await supabase
        .from('vulnerability_scans')
        .select('*')
        .eq('id', vulnerabilityId)
        .single();

      if (vulnError) throw vulnError;

      // Only send alerts for high and critical vulnerabilities
      if (!['high', 'critical'].includes(vulnerability.severity)) {
        return;
      }

      // Prepare template data
      const templateData: VulnerabilityAlertData = {
        domain: vulnerability.affected_component,
        severity: vulnerability.severity,
        vulnerability_type: vulnerability.vulnerability_type,
        description: vulnerability.description,
        remediation: vulnerability.remediation,
        detected_at: new Date(vulnerability.created_at).toLocaleString(),
        date: new Date().toLocaleDateString(),
        cve_id: vulnerability.cve_id,
        cvss_score: vulnerability.cvss_score
      };

      // Send alerts to all recipients
      for (const email of recipientEmails) {
        await this.sendEmail({
          type: 'immediate',
          templateType: 'vulnerability_alert',
          recipientEmail: email,
          templateData
        });
      }
    } catch (error) {
      console.error('Failed to send vulnerability alert:', error);
      throw error;
    }
  }

  async sendAlertGoalPerformanceEmail(
    notificationId: string,
    recipientEmails: string[]
  ): Promise<void> {
    try {
      // Get notification data
      const { data: notification, error: notifError } = await supabase
        .from('alert_goal_notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (notifError) throw notifError;

      // Get recent history for this goal type
      const { data: history, error: historyError } = await supabase
        .from('alert_goal_history')
        .select('*')
        .eq('goal_type', notification.goal_type)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;

      // Get current active goal
      const { data: goal, error: goalError } = await supabase
        .from('alert_performance_goals')
        .select('*')
        .eq('goal_type', notification.goal_type)
        .eq('active', true)
        .single();

      if (goalError) throw goalError;

      // Calculate trend and metrics
      const recentHistory = history?.slice(0, 5) || [];
      const missedCount = recentHistory.filter(h => !h.met_goal).length;
      const missPercentage = (missedCount / recentHistory.length) * 100;
      
      const trend = this.calculateTrend(recentHistory);
      const recommendations = this.generateRecommendations(
        notification.goal_type,
        goal.target_value,
        recentHistory[0]?.actual_value,
        trend
      );

      const goalTypeLabels = {
        response_time: 'Response Time',
        false_positive_rate: 'False Positive Rate',
        uptime_percentage: 'System Uptime'
      };

      // Prepare template data
      const templateData: AlertGoalPerformanceData = {
        goalType: notification.goal_type,
        goalTypeLabel: goalTypeLabels[notification.goal_type] || notification.goal_type,
        targetValue: goal.target_value,
        currentValue: recentHistory[0]?.actual_value || 0,
        consecutiveMisses: notification.consecutive_misses,
        historicalData: (history || []).map(h => ({
          date: new Date(h.created_at).toLocaleDateString(),
          target: h.target_value,
          actual: h.actual_value,
          met: h.met_goal
        })),
        recommendations,
        trend,
        missPercentage
      };

      // Send emails to all recipients
      for (const email of recipientEmails) {
        await this.sendEmail({
          type: 'immediate',
          templateType: 'alert_goal_performance',
          recipientEmail: email,
          templateData
        });
      }
    } catch (error) {
      console.error('Failed to send alert goal performance email:', error);
      throw error;
    }
  }

  private calculateTrend(history: any[]): 'improving' | 'declining' | 'stable' {
    if (!history || history.length < 3) return 'stable';
    
    const recent = history.slice(0, 3);
    const older = history.slice(3, 6);
    
    const recentMisses = recent.filter(h => !h.met_goal).length;
    const olderMisses = older.filter(h => !h.met_goal).length;
    
    if (recentMisses < olderMisses) return 'improving';
    if (recentMisses > olderMisses) return 'declining';
    return 'stable';
  }

  private generateRecommendations(
    goalType: string,
    targetValue: number,
    currentValue: number,
    trend: string
  ): string[] {
    const recommendations: string[] = [];

    switch (goalType) {
      case 'response_time':
        recommendations.push(
          'Review alert routing configuration to ensure alerts reach the right team members',
          'Consider implementing automated acknowledgment for low-priority alerts',
          'Set up escalation policies for unacknowledged alerts',
          'Analyze peak alert times and adjust team coverage accordingly'
        );
        if (trend === 'declining') {
          recommendations.push('Response times are worsening - consider adding more on-call staff');
        }
        break;

      case 'false_positive_rate':
        recommendations.push(
          'Review and refine alert thresholds to reduce noise',
          'Implement machine learning-based anomaly detection for more accurate alerts',
          'Add additional context to alerts to help distinguish true positives',
          'Create feedback loops for team members to mark false positives'
        );
        if (currentValue > targetValue * 1.5) {
          recommendations.push('False positive rate is critically high - immediate threshold review needed');
        }
        break;

      case 'uptime_percentage':
        recommendations.push(
          'Investigate recent system outages and implement preventive measures',
          'Set up redundancy and failover mechanisms',
          'Implement health checks and auto-recovery procedures',
          'Review infrastructure capacity and scaling policies'
        );
        if (trend === 'declining') {
          recommendations.push('System reliability is declining - conduct thorough infrastructure audit');
        }
        break;
    }

    return recommendations;
  }

  async sendProactiveWarningEmail(
    warningId: string,
    recipientEmails: string[]
  ): Promise<void> {
    try {
      // Get warning and prediction data
      const { data: warning, error: warningError } = await supabase
        .from('alert_proactive_warnings')
        .select('*, ml_predictions(*)')
        .eq('id', warningId)
        .single();

      if (warningError) throw warningError;

      const prediction = warning.ml_predictions;

      // Get forecast trends
      const { data: trends, error: trendsError } = await supabase
        .from('alert_forecast_trends')
        .select('*')
        .eq('goal_type', warning.goal_type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const goalTypeLabels = {
        response_time: 'Response Time',
        false_positive_rate: 'False Positive Rate',
        uptime_percentage: 'System Uptime'
      };

      // Prepare template data
      const templateData = {
        goalType: warning.goal_type,
        goalTypeLabel: goalTypeLabels[warning.goal_type] || warning.goal_type,
        hoursUntilMiss: warning.hours_before_predicted_miss,
        predictedValue: prediction.predicted_value,
        goalThreshold: prediction.goal_threshold,
        confidenceScore: (prediction.confidence_score * 100).toFixed(1),
        preventiveActions: warning.preventive_actions || [],
        trendDirection: trends?.trend_direction || 'unknown',
        riskLevel: trends?.risk_level || 'medium',
        forecastData: trends?.forecast_data || []
      };

      // Send emails to all recipients
      for (const email of recipientEmails) {
        await this.sendEmail({
          type: 'immediate',
          templateType: 'proactive_warning',
          recipientEmail: email,
          templateData
        });
      }

      // Mark warning as sent
      await supabase
        .from('alert_proactive_warnings')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', warningId);
    } catch (error) {
      console.error('Failed to send proactive warning email:', error);
      throw error;
    }
  }



  async sendDailyDigest(recipientEmail?: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('digest-generator', {
        body: {
          type: 'daily',
          recipientEmail
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send daily digest:', error);
      throw error;
    }
  }

  async sendWeeklyDigest(recipientEmail?: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('digest-generator', {
        body: {
          type: 'weekly',
          recipientEmail
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send weekly digest:', error);
      throw error;
    }
  }

  async getEmailNotifications(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('email_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getEmailPreferences(userEmail: string): Promise<any> {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateEmailPreferences(preferences: any): Promise<void> {
    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  private async sendEmail(request: EmailNotificationRequest): Promise<void> {
    const { data, error } = await supabase.functions.invoke('email-notification-service', {
      body: request
    });

    if (error) throw error;
    return data;
  }

  async getDeliveryStats(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  }> {
    const { data, error } = await supabase
      .from('email_notifications')
      .select('status');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      sent: data?.filter(n => n.status === 'sent').length || 0,
      delivered: data?.filter(n => n.status === 'delivered').length || 0,
      bounced: data?.filter(n => n.status === 'bounced').length || 0,
      failed: data?.filter(n => n.status === 'failed').length || 0
    };

    return stats;
  }
}

export const emailNotificationService = new EmailNotificationService();