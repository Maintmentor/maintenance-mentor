import { supabase } from '@/lib/supabase';

export interface KeyValidationResult {
  keyName: string;
  keyType: string;
  isValid: boolean;
  error: string | null;
  responseTime: number;
  healthScore: number;
  timestamp: string;
}

export interface KeyStatus {
  id: string;
  key_name: string;
  key_type: string;
  is_valid: boolean;
  last_validated_at: string;
  last_error: string | null;
  expires_at: string | null;
  days_until_expiration: number | null;
  validation_count: number;
  consecutive_failures: number;
  health_score: number;
  metadata: any;
}

export interface KeyAlert {
  id: string;
  key_name: string;
  alert_type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  notified_via_email: boolean;
  notified_via_slack: boolean;
  created_at: string;
}

export class APIKeyValidatorService {
  async validateAllKeys(): Promise<KeyValidationResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('api-key-validator', {
        body: { action: 'validate_all' }
      });

      if (error) throw error;

      // Save results to database
      if (data?.results) {
        await this.saveValidationResults(data.results);
      }

      return data?.results || [];
    } catch (error) {
      console.error('Error validating keys:', error);
      return [];
    }
  }

  async validateSingleKey(keyName: string): Promise<KeyValidationResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('api-key-validator', {
        body: { action: 'validate_single', keyName }
      });

      if (error) throw error;

      // Save result to database
      if (data) {
        await this.saveValidationResults([data]);
      }

      return data;
    } catch (error) {
      console.error('Error validating key:', error);
      return null;
    }
  }

  private async saveValidationResults(results: KeyValidationResult[]) {
    for (const result of results) {
      // Update or insert key status
      await supabase.from('api_key_status').upsert({
        key_name: result.keyName,
        key_type: result.keyType,
        is_valid: result.isValid,
        last_validated_at: result.timestamp,
        last_error: result.error,
        health_score: result.healthScore,
        validation_count: supabase.raw('validation_count + 1'),
        consecutive_failures: result.isValid ? 0 : supabase.raw('consecutive_failures + 1'),
        updated_at: new Date().toISOString()
      });

      // Insert validation history
      await supabase.from('api_key_validation_history').insert({
        key_name: result.keyName,
        is_valid: result.isValid,
        response_time_ms: result.responseTime,
        error_message: result.error,
        validation_details: result,
        validated_at: result.timestamp
      });

      // Create alerts if needed
      if (!result.isValid) {
        await this.createAlert(result);
      }
    }
  }

  private async createAlert(result: KeyValidationResult) {
    const { data: existingAlerts } = await supabase
      .from('api_key_alerts')
      .select('*')
      .eq('key_name', result.keyName)
      .eq('is_resolved', false)
      .eq('alert_type', 'invalid');

    if (existingAlerts && existingAlerts.length === 0) {
      await supabase.from('api_key_alerts').insert({
        key_name: result.keyName,
        alert_type: 'invalid',
        severity: 'critical',
        message: `API key ${result.keyName} is invalid: ${result.error}`,
        is_resolved: false
      });
    }
  }

  async getKeyStatus(): Promise<KeyStatus[]> {
    const { data, error } = await supabase
      .from('api_key_status')
      .select('*')
      .order('key_name');

    if (error) {
      console.error('Error fetching key status:', error);
      return [];
    }

    return data || [];
  }

  async getValidationHistory(keyName?: string, limit = 50): Promise<any[]> {
    let query = supabase
      .from('api_key_validation_history')
      .select('*')
      .order('validated_at', { ascending: false })
      .limit(limit);

    if (keyName) {
      query = query.eq('key_name', keyName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching validation history:', error);
      return [];
    }

    return data || [];
  }

  async getAlerts(includeResolved = false): Promise<KeyAlert[]> {
    let query = supabase
      .from('api_key_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeResolved) {
      query = query.eq('is_resolved', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }

    return data || [];
  }

  async resolveAlert(alertId: string) {
    const { error } = await supabase
      .from('api_key_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }
}

export const apiKeyValidator = new APIKeyValidatorService();
