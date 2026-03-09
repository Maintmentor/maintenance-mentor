export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'API key not configured',
        quota: null
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check API key validity and get usage
    const [modelsRes, usageRes] = await Promise.all([
      fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }),
      fetch('https://api.openai.com/v1/usage?date=' + new Date().toISOString().split('T')[0], {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }).catch(() => null)
    ]);

    const valid = modelsRes.ok;
    let quota = null;
    
    if (valid && usageRes?.ok) {
      const usage = await usageRes.json();
      quota = {
        used: usage.total_usage || 0,
        limit: usage.hard_limit_usd || 120,
        remaining: (usage.hard_limit_usd || 120) - (usage.total_usage || 0)
      };
    }

    return new Response(JSON.stringify({
      valid,
      error: valid ? null : `HTTP ${modelsRes.status}`,
      quota,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      valid: false,
      error: error.message,
      quota: null
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
