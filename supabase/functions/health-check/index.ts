export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action } = await req.json().catch(() => ({ action: 'full' }));

    const results = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      checks: {}
    };

    // Check OpenAI API
    try {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) {
        results.checks.openai = { status: 'error', message: 'API key not configured' };
      } else {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${openaiKey}` },
          signal: AbortSignal.timeout(5000)
        });
        results.checks.openai = {
          status: response.ok ? 'healthy' : 'error',
          statusCode: response.status
        };
      }
    } catch (error) {
      results.checks.openai = { status: 'error', message: error.message };
    }

    // Check Stripe API
    try {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        results.checks.stripe = { status: 'warning', message: 'API key not configured' };
      } else {
        results.checks.stripe = { status: 'healthy', message: 'Key configured' };
      }
    } catch (error) {
      results.checks.stripe = { status: 'error', message: error.message };
    }

    // Check Resend API
    try {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      results.checks.resend = {
        status: resendKey ? 'healthy' : 'warning',
        message: resendKey ? 'Key configured' : 'API key not configured'
      };
    } catch (error) {
      results.checks.resend = { status: 'error', message: error.message };
    }

    // Check Google APIs
    try {
      const googleKey = Deno.env.get('GOOGLE_API_KEY');
      const cseId = Deno.env.get('GOOGLE_CSE_ID');
      results.checks.google = {
        status: (googleKey && cseId) ? 'healthy' : 'warning',
        message: (googleKey && cseId) ? 'APIs configured' : 'Missing configuration'
      };
    } catch (error) {
      results.checks.google = { status: 'error', message: error.message };
    }

    // Determine overall status
    const hasError = Object.values(results.checks).some(c => c.status === 'error');
    results.overall = hasError ? 'degraded' : 'healthy';

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      overall: 'error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
