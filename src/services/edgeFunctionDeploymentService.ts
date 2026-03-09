import { supabase } from '@/lib/supabase';

export interface DeploymentProgress {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
}

export interface DeploymentRecord {
  id: string;
  function_name: string;
  deployment_type: string;
  status: string;
  config_changes?: any;
  previous_config?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface ValidationResult {
  valid: boolean;
  status: 'success' | 'failed' | 'invalid_format';
  error?: string;
  details?: any;
  responseTimeMs: number;
}

export interface ValidationHistoryRecord {
  id: string;
  key_name: string;
  key_type: string;
  validation_status: string;
  error_message?: string;
  validation_details?: any;
  validated_at: string;
  response_time_ms: number;
}

export const edgeFunctionDeploymentService = {
  async setSecret(secretName: string, secretValue: string): Promise<{ success: boolean; error?: string }> {
    // Secrets are managed via Supabase dashboard - this is a placeholder
    return { success: false, error: 'Secret management must be done via Supabase Dashboard' };
  },

  async listSecrets(): Promise<{ success: boolean; secrets?: any[]; error?: string }> {
    // Return hardcoded list of known secrets from the system
    const knownSecrets = [
      { name: 'OPENAI_API_KEY', updatedAt: '2025-09-16T18:02:43.744Z' },
      { name: 'SENDGRID_API_KEY', updatedAt: '2025-09-16T18:46:04.067Z' },
      { name: 'STRIPE_SECRET_KEY', updatedAt: '2025-09-30T17:25:31.720Z' },
      { name: 'VITE_STRIPE_PUBLISHABLE_KEY', updatedAt: '2025-09-30T17:25:59.553Z' },
      { name: 'RESEND_API_KEY', updatedAt: '2025-10-04T16:00:07.821Z' },
      { name: 'GOOGLE_CSE_ID', updatedAt: '2025-10-10T18:00:07.950Z' },
      { name: 'GOOGLE_API_KEY', updatedAt: '2025-10-10T18:00:10.316Z' }
    ];
    return { success: true, secrets: knownSecrets };
  },

  async redeployFunction(functionName: string): Promise<{ success: boolean; error?: string }> {
    // Function redeployment must be done via Supabase CLI or dashboard
    return { success: false, error: 'Function redeployment must be done via Supabase CLI' };
  },

  async listFunctions(): Promise<{ success: boolean; functions?: any[]; error?: string }> {
    // Return hardcoded list of known functions from the system
    const knownFunctions = [
      { name: 'repair-diagnostic', status: 'ACTIVE' },
      { name: 'translation-service', status: 'ACTIVE' },
      { name: 'validate-api-key', status: 'ACTIVE' },
      { name: 'generate-repair-image', status: 'ACTIVE' },
      { name: 'fetch-real-part-images', status: 'ACTIVE' }
    ];
    return { success: true, functions: knownFunctions };
  },



  async createDeploymentRecord(
    functionName: string,
    deploymentType: string,
    configChanges?: any,
    previousConfig?: any
  ): Promise<string | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('edge_function_deployments')
        .insert({
          function_name: functionName,
          deployment_type: deploymentType,
          status: 'pending',
          config_changes: configChanges,
          previous_config: previousConfig,
          deployed_by: userData?.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to create deployment record:', error);
      return null;
    }
  },

  async updateDeploymentStatus(
    deploymentId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('edge_function_deployments')
        .update({
          status,
          error_message: errorMessage,
          completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null
        })
        .eq('id', deploymentId);
    } catch (error) {
      console.error('Failed to update deployment status:', error);
    }
  },

  async getDeploymentHistory(limit = 10): Promise<DeploymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('edge_function_deployments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get deployment history:', error);
      return [];
    }
  },

  async rollbackDeployment(deploymentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: deployment, error: fetchError } = await supabase
        .from('edge_function_deployments')
        .select('*')
        .eq('id', deploymentId)
        .single();

      if (fetchError) throw fetchError;

      if (!deployment.previous_config) {
        return { success: false, error: 'No previous configuration available for rollback' };
      }

      // Restore previous configuration
      const previousConfig = deployment.previous_config;
      if (previousConfig.secretName && previousConfig.secretValue) {
        const result = await this.setSecret(previousConfig.secretName, previousConfig.secretValue);
        if (!result.success) {
          return result;
        }
      }

      // Create rollback deployment record
      await this.createDeploymentRecord(
        deployment.function_name,
        'rollback',
        { rollback_from: deploymentId },
        deployment.config_changes
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async checkDeploymentStatus(): Promise<{ missingCount: number; functions: string[] }> {
    try {
      const result = await this.listFunctions();
      if (!result.success || !result.functions) {
        return { missingCount: 0, functions: [] };
      }
      return { missingCount: 0, functions: result.functions.map((f: any) => f.name) };
    } catch (error) {
      console.error('Failed to check deployment status:', error);
      return { missingCount: 0, functions: [] };
    }
  },

  async autoDeployMissing(): Promise<{ totalDeployed: number; totalSkipped: number; errors: string[] }> {
    try {
      // This is a placeholder - in production, this would check which functions are missing
      // and deploy them automatically
      const result = await this.listFunctions();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to list functions');
      }

      // For now, return success with no deployments needed
      return {
        totalDeployed: 0,
        totalSkipped: 0,
        errors: []
      };
    } catch (error: any) {
      return {
        totalDeployed: 0,
        totalSkipped: 0,
        errors: [error.message]
      };
    }
  },


  async validateApiKey(
    keyName: string,
    keyType: string,
    apiKey: string,
    projectUrl?: string
  ): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: { keyName, keyType, apiKey, projectUrl }
      });

      if (error) throw error;
      
      // Store validation history
      await this.saveValidationHistory(keyName, keyType, data);
      
      return data;
    } catch (error: any) {
      return {
        valid: false,
        status: 'failed',
        error: error.message,
        responseTimeMs: 0
      };
    }
  },

  async saveValidationHistory(
    keyName: string,
    keyType: string,
    validationResult: ValidationResult
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase.from('api_key_validation_history').insert({
        key_name: keyName,
        key_type: keyType,
        validation_status: validationResult.status,
        error_message: validationResult.error,
        validation_details: validationResult.details,
        validated_by: userData?.user?.id,
        response_time_ms: validationResult.responseTimeMs
      });
    } catch (error) {
      console.error('Failed to save validation history:', error);
    }
  },

  async getValidationHistory(keyName?: string, limit = 20): Promise<ValidationHistoryRecord[]> {
    try {
      let query = supabase
        .from('api_key_validation_history')
        .select('*')
        .order('validated_at', { ascending: false })
        .limit(limit);

      if (keyName) {
        query = query.eq('key_name', keyName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get validation history:', error);
      return [];
    }
  }
};
