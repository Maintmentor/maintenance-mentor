import { supabase } from '@/lib/supabase';

export interface ImageQualityAlert {
  id: string;
  alert_type: 'low_accuracy' | 'part_negative_feedback' | 'low_verification_scores';
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface AlertSettings {
  id: string;
  setting_key: string;
  setting_value: {
    enabled: boolean;
    threshold: number;
    email_recipients: string[];
    timeframe_hours?: number;
    sample_size?: number;
  };
  updated_by?: string;
  updated_at: string;
  created_at: string;
}

export const imageQualityAlertService = {
  async getRecentAlerts(limit = 10) {
    const { data, error } = await supabase
      .from('image_quality_alerts')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ImageQualityAlert[];
  },

  async getAlertSettings() {
    const { data, error } = await supabase
      .from('image_quality_alert_settings')
      .select('*')
      .order('setting_key');

    if (error) throw error;
    return data as AlertSettings[];
  },

  async updateAlertSetting(settingKey: string, settingValue: any, userId: string) {
    const { data, error } = await supabase
      .from('image_quality_alert_settings')
      .update({
        setting_value: settingValue,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', settingKey)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acknowledgeAlert(alertId: string, userId: string) {
    const { data, error } = await supabase
      .from('image_quality_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async triggerAlertCheck() {
    const { data, error } = await supabase.functions.invoke('image-quality-alert-checker');
    if (error) throw error;
    return data;
  }
};
