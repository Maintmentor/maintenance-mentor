import { supabase } from '@/lib/supabase';

export interface ConfigurationStatus {
  hasOpenAIKey: boolean;
  keyValid?: boolean;
  lastChecked: Date;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
}

export const envRepairService = {
  // Check if OpenAI API key exists and is valid
  async checkOpenAIKey(): Promise<ConfigurationStatus> {
    try {
      // Try to invoke a function that uses the OpenAI key
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { question: 'test', skipAI: true }
      });

      if (error) {
        return {
          hasOpenAIKey: false,
          keyValid: false,
          lastChecked: new Date(),
          error: error.message
        };
      }

      return {
        hasOpenAIKey: true,
        keyValid: true,
        lastChecked: new Date()
      };
    } catch (error: any) {
      return {
        hasOpenAIKey: false,
        keyValid: false,
        lastChecked: new Date(),
        error: error.message
      };
    }
  },

  // Validate OpenAI API key format and test connection
  async validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('openai-key-validator', {
        body: { apiKey }
      });

      if (error) {
        return {
          valid: false,
          error: error.message
        };
      }

      return data as ValidationResult;
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate API key'
      };
    }
  },

  // Store configuration status in localStorage
  saveConfigStatus(status: ConfigurationStatus): void {
    localStorage.setItem('config_status', JSON.stringify(status));
  },

  // Retrieve configuration status from localStorage
  getConfigStatus(): ConfigurationStatus | null {
    const stored = localStorage.getItem('config_status');
    if (!stored) return null;
    
    const status = JSON.parse(stored);
    status.lastChecked = new Date(status.lastChecked);
    return status;
  }
};
