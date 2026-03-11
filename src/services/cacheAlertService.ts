import { supabase } from '@/lib/supabase';
import { cacheEmailNotificationService } from './cacheEmailNotificationService';


export interface CacheAlert {
  id: string;
  alertType: 'low_hit_rate' | 'high_response_time' | 'storage_limit' | 'api_errors';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
  resolved: boolean;
}

export interface AlertThresholds {
  minHitRate: number; // Minimum acceptable hit rate (%)
  maxResponseTime: number; // Maximum acceptable response time (ms)
  maxStorageSize: number; // Maximum storage in bytes
  maxApiErrors: number; // Maximum API errors per hour
}

class CacheAlertService {
  private defaultThresholds: AlertThresholds = {
    minHitRate: 60,
    maxResponseTime: 1000,
    maxStorageSize: 1024 * 1024 * 1024, // 1GB
    maxApiErrors: 10
  };

  /**
   * Check all cache metrics and create alerts if thresholds exceeded
   */
  async checkAndCreateAlerts(): Promise<CacheAlert[]> {
    const alerts: CacheAlert[] = [];

    try {
      // Check hit rate
      const hitRateAlert = await this.checkHitRate();
      if (hitRateAlert) alerts.push(hitRateAlert);

      // Check response time
      const responseTimeAlert = await this.checkResponseTime();
      if (responseTimeAlert) alerts.push(responseTimeAlert);

      // Check storage usage
      const storageAlert = await this.checkStorageUsage();
      if (storageAlert) alerts.push(storageAlert);

      // Check API errors
      const apiErrorAlert = await this.checkApiErrors();
      if (apiErrorAlert) alerts.push(apiErrorAlert);


      // Save alerts to database and send email notifications
      if (alerts.length > 0) {
        const { data: insertedAlerts } = await supabase.from('cache_performance_alerts').insert(
          alerts.map(alert => ({
            alert_type: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            threshold: alert.threshold,
            current_value: alert.currentValue,
            resolved: false
          }))
        ).select();

        // Send email notifications for critical alerts
        if (insertedAlerts) {
          for (let i = 0; i < insertedAlerts.length; i++) {
            const alert = { ...alerts[i], id: insertedAlerts[i].id };
            if (alert.severity === 'critical' || alert.severity === 'warning') {
              await cacheEmailNotificationService.sendAlertEmails(alert);
            }
          }
        }
      }


      return alerts;
    } catch (error) {
      console.error('Error checking cache alerts:', error);
      return [];
    }
  }

  private async checkHitRate(): Promise<CacheAlert | null> {
    const { data } = await supabase
      .from('image_cache_analytics')
      .select('event_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return null;

    const hits = data.filter(d => d.event_type === 'hit').length;
    const total = data.length;
    const hitRate = (hits / total) * 100;

    if (hitRate < this.defaultThresholds.minHitRate) {
      return {
        id: '',
        alertType: 'low_hit_rate',
        severity: hitRate < 40 ? 'critical' : 'warning',
        message: `Cache hit rate is ${hitRate.toFixed(1)}%, below threshold of ${this.defaultThresholds.minHitRate}%`,
        threshold: this.defaultThresholds.minHitRate,
        currentValue: hitRate,
        createdAt: new Date().toISOString(),
        resolved: false
      };
    }

    return null;
  }

  private async checkResponseTime(): Promise<CacheAlert | null> {
    const { data } = await supabase
      .from('image_cache_analytics')
      .select('response_time_ms')
      .eq('source', 'cache')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .not('response_time_ms', 'is', null);

    if (!data || data.length === 0) return null;

    const avgTime = data.reduce((sum, d) => sum + d.response_time_ms, 0) / data.length;

    if (avgTime > this.defaultThresholds.maxResponseTime) {
      return {
        id: '',
        alertType: 'high_response_time',
        severity: avgTime > 2000 ? 'critical' : 'warning',
        message: `Average cache response time is ${Math.round(avgTime)}ms, above threshold of ${this.defaultThresholds.maxResponseTime}ms`,
        threshold: this.defaultThresholds.maxResponseTime,
        currentValue: avgTime,
        createdAt: new Date().toISOString(),
        resolved: false
      };
    }

    return null;
  }

  private async checkStorageUsage(): Promise<CacheAlert | null> {
    const { data } = await supabase
      .from('image_cache')
      .select('file_size')
      .eq('is_active', true);

    if (!data) return null;

    const totalSize = data.reduce((sum, d) => sum + (d.file_size || 0), 0);

    if (totalSize > this.defaultThresholds.maxStorageSize) {
      return {
        id: '',
        alertType: 'storage_limit',
        severity: totalSize > this.defaultThresholds.maxStorageSize * 1.2 ? 'critical' : 'warning',
        message: `Cache storage usage is ${(totalSize / (1024 * 1024)).toFixed(2)}MB, approaching limit`,
        threshold: this.defaultThresholds.maxStorageSize,
        currentValue: totalSize,
        createdAt: new Date().toISOString(),
        resolved: false
      };
    }

    return null;
  }

  private async checkApiErrors(): Promise<CacheAlert | null> {
    const { data } = await supabase
      .from('image_cache_analytics')
      .select('event_type')
      .eq('event_type', 'error')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const errorCount = data?.length || 0;

    if (errorCount > this.defaultThresholds.maxApiErrors) {
      return {
        id: '',
        alertType: 'api_errors',
        severity: errorCount > 20 ? 'critical' : 'warning',
        message: `${errorCount} API errors in the last hour, above threshold of ${this.defaultThresholds.maxApiErrors}`,
        threshold: this.defaultThresholds.maxApiErrors,
        currentValue: errorCount,
        createdAt: new Date().toISOString(),
        resolved: false
      };
    }

    return null;
  }
}

export const cacheAlertService = new CacheAlertService();
