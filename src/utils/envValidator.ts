import { envRepairService } from '@/services/envRepairService';


export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  keys: {
    supabaseUrl: { valid: boolean; value?: string; error?: string };
    supabaseAnonKey: { valid: boolean; value?: string; error?: string };
    openaiKey: { valid: boolean; value?: string; error?: string };
  };
  autoRepairAttempted?: boolean;
  autoRepairSuccess?: boolean;
}


export class EnvValidator {
  static validateSupabaseUrl(url: string): { valid: boolean; error?: string } {
    if (!url || url.trim() === '') {
      return { valid: false, error: 'Supabase URL is required' };
    }
    
    if (!url.startsWith('https://')) {
      return { valid: false, error: 'Supabase URL must start with https://' };
    }
    
    if (!url.includes('.supabase.co')) {
      return { valid: false, error: 'Invalid Supabase URL format' };
    }
    
    return { valid: true };
  }

  static validateSupabaseAnonKey(key: string): { valid: boolean; error?: string } {
    if (!key || key.trim() === '') {
      return { valid: false, error: 'Supabase Anon Key is required' };
    }
    
    // Check JWT format (header.payload.signature)
    const parts = key.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format (should have 3 parts)' };
    }
    
    try {
      // Decode and validate JWT structure
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.role || !payload.iss) {
        return { valid: false, error: 'Invalid JWT payload structure' };
      }
      
      if (payload.role !== 'anon') {
        return { valid: false, error: 'Key must be anon role' };
      }
    } catch (e) {
      return { valid: false, error: 'Malformed JWT - cannot decode' };
    }
    
    return { valid: true };
  }

  static validateOpenAIKey(key: string): { valid: boolean; error?: string } {
    if (!key || key.trim() === '') {
      return { valid: false, error: 'OpenAI API Key is required' };
    }
    
    if (!key.startsWith('sk-')) {
      return { valid: false, error: 'OpenAI key must start with sk-' };
    }
    
    if (key.length < 40) {
      return { valid: false, error: 'OpenAI key appears too short' };
    }
    
    return { valid: true };
  }

  static async validateEnvWithAutoRepair(): Promise<EnvValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    const urlValidation = this.validateSupabaseUrl(supabaseUrl);
    const keyValidation = this.validateSupabaseAnonKey(supabaseAnonKey);
    const openaiValidation = this.validateOpenAIKey(openaiKey);
    
    if (!urlValidation.valid) errors.push(urlValidation.error!);
    if (!keyValidation.valid) errors.push(keyValidation.error!);
    if (!openaiValidation.valid) warnings.push(openaiValidation.error!);
    
    const result: EnvValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      keys: {
        supabaseUrl: { valid: urlValidation.valid, value: supabaseUrl, error: urlValidation.error },
        supabaseAnonKey: { valid: keyValidation.valid, value: supabaseAnonKey, error: keyValidation.error },
        openaiKey: { valid: openaiValidation.valid, value: openaiKey, error: openaiValidation.error }
      }
    };

    // Auto-repair functionality removed - not needed for basic validation
    
    return result;
  }


  static validateEnv(): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    const urlValidation = this.validateSupabaseUrl(supabaseUrl);
    const keyValidation = this.validateSupabaseAnonKey(supabaseAnonKey);
    const openaiValidation = this.validateOpenAIKey(openaiKey);
    
    if (!urlValidation.valid) errors.push(urlValidation.error!);
    if (!keyValidation.valid) errors.push(keyValidation.error!);
    if (!openaiValidation.valid) warnings.push(openaiValidation.error!);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      keys: {
        supabaseUrl: { valid: urlValidation.valid, value: supabaseUrl, error: urlValidation.error },
        supabaseAnonKey: { valid: keyValidation.valid, value: supabaseAnonKey, error: keyValidation.error },
        openaiKey: { valid: openaiValidation.valid, value: openaiKey, error: openaiValidation.error }
      }
    };
  }
}

