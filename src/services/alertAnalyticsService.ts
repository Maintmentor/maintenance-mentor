import { supabase } from '@/lib/supabase';

export interface AlertFrequencyData {
  date: string;
  count: number;
  alertType: string;
}

export interface AlertTypeDistribution {
  alertType: string;
  count: number;
  percentage: number;
}

export interface ResponseTimeMetrics {
  averageResponseTime: number;
  medianResponseTime: number;
  fastestResponse: number;
  slowestResponse: number;
}

export interface SystemReliabilityMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  uptimePercentage: number;
  averageExecutionTime: number;
}

export interface AlertEffectivenessMetrics {
  totalAlerts: number;
  acknowledgedAlerts: number;
  falsePositives: number;
  falsePositiveRate: number;
  averageAcknowledgmentTime: number;
}

export interface PeakAlertTime {
  hour: number;
  count: number;
}

export const alertAnalyticsService = {
  async getAlertFrequency(days: number = 30): Promise<AlertFrequencyData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('image_quality_alerts')
      .select('created_at, alert_type')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date and alert type
    const grouped = data.reduce((acc: any, alert) => {
      const date = new Date(alert.created_at).toISOString().split('T')[0];
      const key = `${date}-${alert.alert_type}`;
      
      if (!acc[key]) {
        acc[key] = { date, count: 0, alertType: alert.alert_type };
      }
      acc[key].count++;
      return acc;
    }, {});

    return Object.values(grouped);
  },

  async getAlertTypeDistribution(): Promise<AlertTypeDistribution[]> {
    const { data, error } = await supabase
      .from('image_quality_alerts')
      .select('alert_type');

    if (error) throw error;

    const counts = data.reduce((acc: any, alert) => {
      acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
      return acc;
    }, {});

    const total = data.length;
    return Object.entries(counts).map(([alertType, count]: [string, any]) => ({
      alertType,
      count,
      percentage: (count / total) * 100
    }));
  },

  async getResponseTimeMetrics(): Promise<ResponseTimeMetrics> {
    const { data, error } = await supabase
      .from('image_quality_alerts')
      .select('created_at, acknowledged_at')
      .not('acknowledged_at', 'is', null);

    if (error) throw error;

    const responseTimes = data.map(alert => {
      const created = new Date(alert.created_at).getTime();
      const acknowledged = new Date(alert.acknowledged_at).getTime();
      return (acknowledged - created) / 1000 / 60; // minutes
    });

    responseTimes.sort((a, b) => a - b);

    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      medianResponseTime: responseTimes[Math.floor(responseTimes.length / 2)] || 0,
      fastestResponse: responseTimes[0] || 0,
      slowestResponse: responseTimes[responseTimes.length - 1] || 0
    };
  },

  async getSystemReliabilityMetrics(): Promise<SystemReliabilityMetrics> {
    const { data, error } = await supabase
      .from('alert_execution_logs')
      .select('status, execution_time_ms');

    if (error) throw error;

    const successful = data.filter(log => log.status === 'success').length;
    const failed = data.filter(log => log.status === 'failed').length;
    const total = data.length;

    const avgExecutionTime = data.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / total || 0;

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      uptimePercentage: (successful / total) * 100 || 0,
      averageExecutionTime: avgExecutionTime
    };
  },

  async getAlertEffectivenessMetrics(): Promise<AlertEffectivenessMetrics> {
    const { data, error } = await supabase
      .from('image_quality_alerts')
      .select('created_at, acknowledged_at, metadata');

    if (error) throw error;

    const acknowledged = data.filter(alert => alert.acknowledged_at);
    const falsePositives = data.filter(alert => 
      alert.metadata && (alert.metadata as any).false_positive === true
    ).length;

    const acknowledgmentTimes = acknowledged.map(alert => {
      const created = new Date(alert.created_at).getTime();
      const ack = new Date(alert.acknowledged_at).getTime();
      return (ack - created) / 1000 / 60; // minutes
    });

    const avgAckTime = acknowledgmentTimes.reduce((a, b) => a + b, 0) / acknowledgmentTimes.length || 0;

    return {
      totalAlerts: data.length,
      acknowledgedAlerts: acknowledged.length,
      falsePositives,
      falsePositiveRate: (falsePositives / data.length) * 100 || 0,
      averageAcknowledgmentTime: avgAckTime
    };
  },

  async getPeakAlertTimes(): Promise<PeakAlertTime[]> {
    const { data, error } = await supabase
      .from('image_quality_alerts')
      .select('created_at');

    if (error) throw error;

    const hourCounts = data.reduce((acc: any, alert) => {
      const hour = new Date(alert.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts[hour] || 0
    }));
  },

  async exportAlertAnalytics(startDate: Date, endDate: Date): Promise<Blob> {
    const { data: alerts, error } = await supabase
      .from('image_quality_alerts')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const csv = [
      ['Date', 'Alert Type', 'Severity', 'Message', 'Acknowledged', 'Response Time (min)'].join(','),
      ...alerts.map(alert => {
        const responseTime = alert.acknowledged_at 
          ? ((new Date(alert.acknowledged_at).getTime() - new Date(alert.created_at).getTime()) / 1000 / 60).toFixed(2)
          : 'N/A';
        
        return [
          new Date(alert.created_at).toISOString(),
          alert.alert_type,
          alert.severity,
          `"${alert.message}"`,
          alert.acknowledged_at ? 'Yes' : 'No',
          responseTime
        ].join(',');
      })
    ].join('\n');

    return new Blob([csv], { type: 'text/csv' });
  }
};
