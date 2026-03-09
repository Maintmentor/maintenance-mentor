import { supabase } from '@/lib/supabase';

export interface MLPrediction {
  id: string;
  goal_type: 'response_time' | 'false_positive_rate' | 'uptime_percentage';
  prediction_date: string;
  predicted_value: number;
  confidence_score: number;
  goal_threshold: number;
  will_miss_goal: boolean;
  hours_until_miss: number | null;
  recommended_actions: string[];
  historical_data_points: number;
}

export interface ForecastTrend {
  id: string;
  goal_type: string;
  forecast_horizon_hours: number;
  forecast_data: Array<{
    timestamp: string;
    predicted_value: number;
    confidence: number;
  }>;
  trend_direction: 'improving' | 'declining' | 'stable';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface Anomaly {
  id: string;
  goal_type: string;
  anomaly_type: 'spike' | 'drop' | 'pattern_break';
  detected_at: string;
  severity: 'low' | 'medium' | 'high';
  anomaly_score: number;
  context: any;
}

class MLAnalyticsService {
  // Generate predictions using historical data
  async generatePredictions(userId: string): Promise<MLPrediction[]> {
    try {
      const { data, error } = await supabase.functions.invoke('ml-analytics-processor', {
        body: { userId, action: 'generate_predictions' }
      });

      if (error) throw error;
      return data.predictions || [];
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  }

  // Get recent predictions
  async getPredictions(userId: string, goalType?: string): Promise<MLPrediction[]> {
    try {
      let query = supabase
        .from('ml_predictions')
        .select('*')
        .eq('user_id', userId)
        .order('prediction_date', { ascending: false })
        .limit(50);

      if (goalType) {
        query = query.eq('goal_type', goalType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  }

  // Get forecast trends
  async getForecastTrends(userId: string, hours: number = 48): Promise<ForecastTrend[]> {
    try {
      const { data, error } = await supabase
        .from('alert_forecast_trends')
        .select('*')
        .eq('user_id', userId)
        .eq('forecast_horizon_hours', hours)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forecast trends:', error);
      return [];
    }
  }

  // Detect anomalies in alert performance
  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    try {
      const { data, error } = await supabase.functions.invoke('ml-analytics-processor', {
        body: { userId, action: 'detect_anomalies' }
      });

      if (error) throw error;
      return data.anomalies || [];
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  // Get proactive warnings
  async getProactiveWarnings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('alert_proactive_warnings')
        .select('*, ml_predictions(*)')
        .eq('user_id', userId)
        .order('warning_sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching proactive warnings:', error);
      return [];
    }
  }

  // Check if proactive warnings should be sent
  async checkAndSendProactiveWarnings(userId: string): Promise<void> {
    try {
      const predictions = await this.getPredictions(userId);
      
      for (const prediction of predictions) {
        if (prediction.will_miss_goal && prediction.hours_until_miss && 
            prediction.hours_until_miss >= 24 && prediction.hours_until_miss <= 48) {
          
          // Check if warning already sent
          const { data: existing } = await supabase
            .from('alert_proactive_warnings')
            .select('id')
            .eq('prediction_id', prediction.id)
            .single();

          if (!existing) {
            await this.sendProactiveWarning(userId, prediction);
          }
        }
      }
    } catch (error) {
      console.error('Error checking proactive warnings:', error);
    }
  }

  // Send proactive warning
  private async sendProactiveWarning(userId: string, prediction: MLPrediction): Promise<void> {
    try {
      const { error } = await supabase
        .from('alert_proactive_warnings')
        .insert({
          user_id: userId,
          prediction_id: prediction.id,
          goal_type: prediction.goal_type,
          hours_before_predicted_miss: prediction.hours_until_miss,
          confidence_score: prediction.confidence_score,
          preventive_actions: prediction.recommended_actions
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending proactive warning:', error);
    }
  }
}

export const mlAnalyticsService = new MLAnalyticsService();
