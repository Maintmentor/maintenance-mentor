import { supabase } from '@/lib/supabase';
import { CacheAlert } from './cacheAlertService';

export interface EmailNotificationPreferences {
  id: string;
  userId: string;
  email: string;
  alertTypes: string[];
  severityLevels: string[];
  enabled: boolean;
}

export interface EmailNotificationLog {
  id: string;
  alertId: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  deliveryStatus: string;
  errorMessage?: string;
}

class CacheEmailNotificationService {
  /**
   * Send email notifications for cache alerts
   */
  async sendAlertEmails(alert: CacheAlert): Promise<void> {
    try {
      // Get recipients based on preferences
      const recipients = await this.getRecipientsForAlert(alert);
      
      if (recipients.length === 0) {
        console.log('No recipients configured for this alert type');
        return;
      }

      // Call edge function to send emails
      const { data, error } = await supabase.functions.invoke('cache-alert-email-sender', {
        body: {
          alertType: alert.alertType,
          severity: alert.severity,
          message: alert.message,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          recipients: recipients.map(r => r.email)
        }
      });

      if (error) throw error;

      // Log email notifications
      await this.logEmailNotifications(alert.id, recipients, data.results);
    } catch (error) {
      console.error('Error sending alert emails:', error);
    }
  }

  /**
   * Get recipients who should receive this alert
   */
  private async getRecipientsForAlert(alert: CacheAlert): Promise<EmailNotificationPreferences[]> {
    const { data, error } = await supabase
      .from('email_notification_preferences')
      .select('*')
      .eq('enabled', true)
      .contains('alert_types', [alert.alertType])
      .contains('severity_levels', [alert.severity]);

    if (error) {
      console.error('Error fetching recipients:', error);
      return [];
    }

    return data.map(d => ({
      id: d.id,
      userId: d.user_id,
      email: d.email,
      alertTypes: d.alert_types,
      severityLevels: d.severity_levels,
      enabled: d.enabled
    }));
  }

  /**
   * Log email notifications to database
   */
  private async logEmailNotifications(alertId: string, recipients: EmailNotificationPreferences[], results: any[]): Promise<void> {
    const logs = results.map((result, index) => ({
      alert_id: alertId,
      recipient_email: recipients[index].email,
      subject: result.result?.subject || 'Cache Alert',
      delivery_status: result.success ? 'sent' : 'failed',
      error_message: result.success ? null : JSON.stringify(result.result)
    }));

    await supabase.from('cache_email_notifications').insert(logs);
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string): Promise<EmailNotificationPreferences | null> {
    const { data, error } = await supabase
      .from('email_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      alertTypes: data.alert_types,
      severityLevels: data.severity_levels,
      enabled: data.enabled
    };
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(userId: string, preferences: Partial<EmailNotificationPreferences>): Promise<void> {
    const { error } = await supabase
      .from('email_notification_preferences')
      .upsert({
        user_id: userId,
        email: preferences.email,
        alert_types: preferences.alertTypes,
        severity_levels: preferences.severityLevels,
        enabled: preferences.enabled,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Get email notification history
   */
  async getNotificationHistory(limit = 50): Promise<EmailNotificationLog[]> {
    const { data, error } = await supabase
      .from('cache_email_notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(d => ({
      id: d.id,
      alertId: d.alert_id,
      recipientEmail: d.recipient_email,
      subject: d.subject,
      sentAt: d.sent_at,
      deliveryStatus: d.delivery_status,
      errorMessage: d.error_message
    }));
  }
}

export const cacheEmailNotificationService = new CacheEmailNotificationService();
