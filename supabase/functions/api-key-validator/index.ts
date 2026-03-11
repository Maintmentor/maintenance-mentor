export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, keyName } = await req.json();

    if (action === 'validate_all') {
      const results = await validateAllKeys();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (action === 'validate_single' && keyName) {
      const result = await validateSingleKey(keyName);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

async function validateAllKeys() {
  const keys = [
    { name: 'OPENAI_API_KEY', type: 'openai', validator: validateOpenAI },
    { name: 'STRIPE_SECRET_KEY', type: 'stripe', validator: validateStripe },
    { name: 'SENDGRID_API_KEY', type: 'sendgrid', validator: validateSendGrid },
    { name: 'RESEND_API_KEY', type: 'resend', validator: validateResend },
    { name: 'GOOGLE_API_KEY', type: 'google', validator: validateGoogle }
  ];

  const results = [];
  for (const key of keys) {
    const result = await key.validator(key.name);
    results.push(result);
  }

  return { results, timestamp: new Date().toISOString() };
}

async function validateSingleKey(keyName: string) {
  const validators = {
    'OPENAI_API_KEY': validateOpenAI,
    'STRIPE_SECRET_KEY': validateStripe,
    'SENDGRID_API_KEY': validateSendGrid,
    'RESEND_API_KEY': validateResend,
    'GOOGLE_API_KEY': validateGoogle
  };

  const validator = validators[keyName];
  if (!validator) {
    return { error: 'Unknown key name' };
  }

  return await validator(keyName);
}

async function validateOpenAI(keyName: string) {
  const apiKey = Deno.env.get(keyName);
  const startTime = Date.now();
  
  if (!apiKey) {
    return createResult(keyName, 'openai', false, 'Key not found', Date.now() - startTime);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const responseTime = Date.now() - startTime;
    const isValid = response.ok;
    const error = isValid ? null : `HTTP ${response.status}`;
    
    return createResult(keyName, 'openai', isValid, error, responseTime);
  } catch (error) {
    return createResult(keyName, 'openai', false, error.message, Date.now() - startTime);
  }
}

async function validateStripe(keyName: string) {
  const apiKey = Deno.env.get(keyName);
  const startTime = Date.now();
  
  if (!apiKey) {
    return createResult(keyName, 'stripe', false, 'Key not found', Date.now() - startTime);
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const responseTime = Date.now() - startTime;
    const isValid = response.ok;
    const error = isValid ? null : `HTTP ${response.status}`;
    
    return createResult(keyName, 'stripe', isValid, error, responseTime);
  } catch (error) {
    return createResult(keyName, 'stripe', false, error.message, Date.now() - startTime);
  }
}

async function validateSendGrid(keyName: string) {
  const apiKey = Deno.env.get(keyName);
  const startTime = Date.now();
  
  if (!apiKey) {
    return createResult(keyName, 'sendgrid', false, 'Key not found', Date.now() - startTime);
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const responseTime = Date.now() - startTime;
    const isValid = response.ok;
    const error = isValid ? null : `HTTP ${response.status}`;
    
    return createResult(keyName, 'sendgrid', isValid, error, responseTime);
  } catch (error) {
    return createResult(keyName, 'sendgrid', false, error.message, Date.now() - startTime);
  }
}

async function validateResend(keyName: string) {
  const apiKey = Deno.env.get(keyName);
  const startTime = Date.now();
  
  if (!apiKey) {
    return createResult(keyName, 'resend', false, 'Key not found', Date.now() - startTime);
  }

  try {
    const response = await fetch('https://api.resend.com/api-keys', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const responseTime = Date.now() - startTime;
    const isValid = response.ok;
    const error = isValid ? null : `HTTP ${response.status}`;
    
    return createResult(keyName, 'resend', isValid, error, responseTime);
  } catch (error) {
    return createResult(keyName, 'resend', false, error.message, Date.now() - startTime);
  }
}

async function validateGoogle(keyName: string) {
  const apiKey = Deno.env.get(keyName);
  const startTime = Date.now();
  
  if (!apiKey) {
    return createResult(keyName, 'google', false, 'Key not found', Date.now() - startTime);
  }

  try {
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=test&q=test`);
    
    const responseTime = Date.now() - startTime;
    const isValid = response.status !== 403;
    const error = isValid ? null : 'Invalid or restricted key';
    
    return createResult(keyName, 'google', isValid, error, responseTime);
  } catch (error) {
    return createResult(keyName, 'google', false, error.message, Date.now() - startTime);
  }
}

function createResult(keyName: string, keyType: string, isValid: boolean, error: string | null, responseTime: number) {
  return {
    keyName,
    keyType,
    isValid,
    error,
    responseTime,
    healthScore: isValid ? 100 : 0,
    timestamp: new Date().toISOString()
  };
}
