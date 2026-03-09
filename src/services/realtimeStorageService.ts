import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface StorageEvent {
  id: string;
  bucket_name: string;
  event_type: 'upload' | 'delete' | 'update' | 'access';
  file_path: string;
  file_size: number;
  user_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UploadProgress {
  file_id: string;
  file_name: string;
  bucket_name: string;
  progress: number;
  total_size: number;
  uploaded_size: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface CriticalAlert {
  id: string;
  type: 'capacity_critical' | 'unusual_activity' | 'quota_exceeded' | 'security_breach';
  bucket_name: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  details: Record<string, any>;
  timestamp: string;
}

class RealtimeStorageService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private uploadProgress: Map<string, UploadProgress> = new Map();
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();

  // Subscribe to storage metrics changes
  subscribeToMetrics(callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel('storage-metrics')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'storage_metrics' 
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set('metrics', channel);
    return channel;
  }

  // Subscribe to storage alerts
  subscribeToAlerts(callback: (alert: CriticalAlert) => void): RealtimeChannel {
    const channel = supabase
      .channel('storage-alerts')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'storage_alerts' 
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const alert = this.formatAlert(payload.new);
          callback(alert);
          
          // Send immediate notification for critical alerts
          if (alert.severity === 'critical') {
            this.sendCriticalNotification(alert);
          }
        }
      )
      .subscribe();

    this.channels.set('alerts', channel);
    return channel;
  }

  // Subscribe to storage events (uploads, deletes, etc.)
  subscribeToStorageEvents(callback: (event: StorageEvent) => void): RealtimeChannel {
    const channel = supabase
      .channel('storage-events')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'storage_events' 
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const event = this.formatStorageEvent(payload);
          callback(event);
        }
      )
      .subscribe();

    this.channels.set('events', channel);
    return channel;
  }

  // Track upload progress
  trackUpload(
    file: File,
    bucketName: string,
    onProgress: (progress: UploadProgress) => void
  ): Promise<{ data: any; error: any }> {
    const fileId = `${Date.now()}-${file.name}`;
    const progress: UploadProgress = {
      file_id: fileId,
      file_name: file.name,
      bucket_name: bucketName,
      progress: 0,
      total_size: file.size,
      uploaded_size: 0,
      status: 'pending'
    };

    this.uploadProgress.set(fileId, progress);
    onProgress(progress);

    // Create a custom upload with progress tracking
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          const updatedProgress: UploadProgress = {
            ...progress,
            progress: percentComplete,
            uploaded_size: e.loaded,
            status: 'uploading'
          };
          this.uploadProgress.set(fileId, updatedProgress);
          onProgress(updatedProgress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const finalProgress: UploadProgress = {
            ...progress,
            progress: 100,
            uploaded_size: file.size,
            status: 'completed'
          };
          this.uploadProgress.set(fileId, finalProgress);
          onProgress(finalProgress);
          
          // Log the upload event
          await this.logStorageEvent({
            bucket_name: bucketName,
            event_type: 'upload',
            file_path: file.name,
            file_size: file.size,
            user_id: (await supabase.auth.getUser()).data.user?.id || '',
            timestamp: new Date().toISOString()
          });
          
          resolve({ data: xhr.response, error: null });
        } else {
          const errorProgress: UploadProgress = {
            ...progress,
            status: 'failed',
            error: xhr.statusText
          };
          this.uploadProgress.set(fileId, errorProgress);
          onProgress(errorProgress);
          resolve({ data: null, error: xhr.statusText });
        }
      });

      xhr.addEventListener('error', () => {
        const errorProgress: UploadProgress = {
          ...progress,
          status: 'failed',
          error: 'Upload failed'
        };
        this.uploadProgress.set(fileId, errorProgress);
        onProgress(errorProgress);
        resolve({ data: null, error: 'Upload failed' });
      });

      // Perform the actual upload using Supabase storage
      supabase.storage
        .from(bucketName)
        .upload(file.name, file)
        .then(({ data, error }) => {
          if (!error) {
            xhr.status = 200;
            xhr.response = data;
          } else {
            xhr.status = 500;
            xhr.statusText = error.message;
          }
          xhr.dispatchEvent(new Event('load'));
        });
    });
  }

  // Log storage events
  async logStorageEvent(event: Omit<StorageEvent, 'id'>): Promise<void> {
    await supabase.from('storage_events').insert([event]);
  }

  // Send critical notification (email + push)
  async sendCriticalNotification(alert: CriticalAlert): Promise<void> {
    try {
      // Send email notification
      await supabase.functions.invoke('critical-storage-alert', {
        body: { alert }
      });

      // Send push notification
      await supabase.functions.invoke('push-notification-sender', {
        body: {
          title: `🚨 ${alert.type.replace(/_/g, ' ').toUpperCase()}`,
          body: alert.message,
          type: 'critical_alerts',
          data: {
            alert_id: alert.id,
            bucket_name: alert.bucket_name,
            severity: alert.severity,
            details: alert.details
          }
        }
      });
    } catch (error) {
      console.error('Failed to send critical notification:', error);
    }
  }


  // Get live storage statistics
  async getLiveStats(): Promise<any> {
    const { data } = await supabase
      .from('storage_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    return data;
  }

  // Monitor bucket capacity in real-time
  async monitorBucketCapacity(
    bucketName: string,
    threshold: number = 80
  ): Promise<void> {
    const { data: metrics } = await supabase
      .from('storage_metrics')
      .select('*')
      .eq('bucket_name', bucketName)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (metrics && metrics.usage_percentage >= threshold) {
      await this.sendCriticalNotification({
        id: `alert-${Date.now()}`,
        type: 'capacity_critical',
        bucket_name: bucketName,
        severity: metrics.usage_percentage >= 95 ? 'critical' : 'high',
        message: `Bucket ${bucketName} is at ${metrics.usage_percentage}% capacity`,
        details: metrics,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Format alert payload
  private formatAlert(payload: any): CriticalAlert {
    return {
      id: payload.id,
      type: payload.alert_type,
      bucket_name: payload.bucket_name,
      severity: payload.severity || 'medium',
      message: payload.message,
      details: payload.details || {},
      timestamp: payload.created_at
    };
  }

  // Format storage event
  private formatStorageEvent(payload: RealtimePostgresChangesPayload<any>): StorageEvent {
    const data = payload.new || payload.old;
    return {
      id: data.id,
      bucket_name: data.bucket_name,
      event_type: data.event_type,
      file_path: data.file_path,
      file_size: data.file_size,
      user_id: data.user_id,
      timestamp: data.timestamp,
      metadata: data.metadata
    };
  }

  // Cleanup subscriptions
  unsubscribeAll(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.uploadProgress.clear();
  }
}

export const realtimeStorageService = new RealtimeStorageService();