import { supabase } from '@/lib/supabase';

export interface StorageMetric {
  id: string;
  bucket_name: string;
  total_size: number;
  file_count: number;
  avg_file_size: number;
  max_file_size: number;
  capacity_percentage: number;
  created_at: string;
}

export interface StorageAlert {
  id: string;
  alert_type: 'capacity' | 'unusual_pattern' | 'stale_files';
  bucket_name?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: any;
  notification_sent: boolean;
  notification_sent_at?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface StoragePrediction {
  id: string;
  bucket_name: string;
  prediction_date: string;
  predicted_size: number;
  predicted_file_count?: number;
  confidence_score?: number;
  model_version?: string;
  created_at: string;
}

class StorageMonitoringService {
  async getStorageMetrics(bucketName?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('storage_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (bucketName) {
      query = query.eq('bucket_name', bucketName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as StorageMetric[];
  }

  async getStorageAlerts(resolved: boolean = false) {
    const { data, error } = await supabase
      .from('storage_alerts')
      .select('*')
      .eq('resolved', resolved)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data as StorageAlert[];
  }

  async getStoragePredictions(bucketName?: string) {
    let query = supabase
      .from('storage_predictions')
      .select('*')
      .gte('prediction_date', new Date().toISOString().split('T')[0])
      .order('prediction_date', { ascending: true });

    if (bucketName) {
      query = query.eq('bucket_name', bucketName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as StoragePrediction[];
  }

  async resolveAlert(alertId: string) {
    const { error } = await supabase
      .from('storage_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async triggerStorageMonitor() {
    const { data, error } = await supabase.functions.invoke('storage-monitor');
    if (error) throw error;
    return data;
  }

  async triggerAlertNotifications() {
    const { data, error } = await supabase.functions.invoke('storage-alert-notifier');
    if (error) throw error;
    return data;
  }

  async generatePredictions(bucketName: string, historicalData: StorageMetric[]) {
    if (historicalData.length < 7) {
      return null; // Need at least 7 days of data
    }

    // Simple linear regression for predictions
    const sortedData = historicalData.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const sizes = sortedData.map(d => d.total_size);
    const n = sizes.length;
    
    // Calculate slope and intercept
    const xSum = (n * (n - 1)) / 2;
    const ySum = sizes.reduce((sum, y) => sum + y, 0);
    const xySum = sizes.reduce((sum, y, i) => sum + (i * y), 0);
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    // Generate predictions for next 30 days
    const predictions: Partial<StoragePrediction>[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      
      const predictedSize = Math.max(0, intercept + slope * (n + i));
      const confidence = Math.max(0.5, 1 - (i * 0.01)); // Confidence decreases over time

      predictions.push({
        bucket_name: bucketName,
        prediction_date: futureDate.toISOString().split('T')[0],
        predicted_size: Math.round(predictedSize),
        confidence_score: confidence,
        model_version: 'linear_v1'
      });
    }

    // Store predictions
    const { error } = await supabase
      .from('storage_predictions')
      .upsert(predictions, { onConflict: 'bucket_name,prediction_date' });

    if (error) throw error;
    return predictions;
  }

  calculateStorageTrends(metrics: StorageMetric[]) {
    if (metrics.length < 2) return null;

    const sortedMetrics = metrics.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const first = sortedMetrics[0];
    const last = sortedMetrics[sortedMetrics.length - 1];
    
    const sizeGrowth = last.total_size - first.total_size;
    const sizeGrowthRate = (sizeGrowth / first.total_size) * 100;
    
    const fileGrowth = last.file_count - first.file_count;
    const fileGrowthRate = (fileGrowth / first.file_count) * 100;

    const avgDailyGrowth = sizeGrowth / sortedMetrics.length;
    const daysUntilFull = last.capacity_percentage > 0 
      ? Math.round((100 - last.capacity_percentage) / (sizeGrowthRate / sortedMetrics.length))
      : null;

    return {
      sizeGrowth,
      sizeGrowthRate,
      fileGrowth,
      fileGrowthRate,
      avgDailyGrowth,
      daysUntilFull,
      currentCapacity: last.capacity_percentage,
      trend: sizeGrowthRate > 10 ? 'increasing' : 
             sizeGrowthRate < -10 ? 'decreasing' : 'stable'
    };
  }
}

export const storageMonitoringService = new StorageMonitoringService();