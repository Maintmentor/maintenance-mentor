import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: any;
  responseTimeMs: number;
}

async function validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
  const startTime = Date.now();
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const responseTimeMs = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return { valid: true, details: { modelCount: data.data?.length }, responseTimeMs };
    }
    const error = await response.text();
    return { valid: false, error: `OpenAI API error: ${error}`, responseTimeMs };
  } catch (error) {
    return { valid: false, error: error.message, responseTimeMs: Date.now() - startTime };
  }
}

async function validateStripeKey(apiKey: string): Promise<ValidationResult> {
  const startTime = Date.now();
  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const responseTimeMs = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return { valid: true, details: { available: data.available }, responseTimeMs };
    }
    const error = await response.text();
    return { valid: false, error: `Stripe API error: ${error}`, responseTimeMs };
  } catch (error) {
    return { valid: false, error: error.message, responseTimeMs: Date.now() - startTime };
  }
}

async function validateSupabaseKey(apiKey: string, projectUrl: string): Promise<ValidationResult> {
  const startTime = Date.now();
  try {
    const client = createClient(projectUrl, apiKey);
    const { error } = await client.from('profiles').select('count').limit(1);
    const responseTimeMs = Date.now() - startTime;
    
    if (!error) {
      return { valid: true, details: { connection: 'successful' }, responseTimeMs };
    }
    return { valid: false, error: `Supabase error: ${error.message}`, responseTimeMs };
  } catch (error) {
    return { valid: false, error: error.message, responseTimeMs: Date.now() - startTime };
  }
}

function validateKeyFormat(keyType: string, apiKey: string): { valid: boolean; error?: string } {
  const patterns: Record<string, RegExp> = {
    openai: /^sk-[A-Za-z0-9]{48,}$/,
    stripe: /^(sk|pk)_(test|live)_[A-Za-z0-9]{24,}$/,
    supabase_anon: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    supabase_service: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  };

  const pattern = patterns[keyType];
  if (!pattern) return { valid: true }; // Unknown type, skip format validation
  
  if (!pattern.test(apiKey)) {
    return { valid: false, error: `Invalid ${keyType} key format` };
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyName, keyType, apiKey, projectUrl } = await req.json();
    
    // Format validation
    const formatCheck = validateKeyFormat(keyType, apiKey);
    if (!formatCheck.valid) {
      return new Response(JSON.stringify({
        valid: false,
        status: 'invalid_format',
        error: formatCheck.error,
        responseTimeMs: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Connection testing
    let result: ValidationResult;
    switch (keyType) {
      case 'openai':
        result = await validateOpenAIKey(apiKey);
        break;
      case 'stripe':
        result = await validateStripeKey(apiKey);
        break;
      case 'supabase_anon':
      case 'supabase_service':
        result = await validateSupabaseKey(apiKey, projectUrl || '');
        break;
      default:
        result = { valid: true, details: { note: 'No validation available' }, responseTimeMs: 0 };
    }

    return new Response(JSON.stringify({
      ...result,
      status: result.valid ? 'success' : 'failed'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
