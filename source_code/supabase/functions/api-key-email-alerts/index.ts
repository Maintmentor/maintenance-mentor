export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { data: keyStatuses } = await supabase
      .from('api_key_status')
      .select('*')
      .or('is_valid.eq.false,expires_at.lt.' + new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!keyStatuses || keyStatuses.length === 0) {
      return new Response(JSON.stringify({ message: 'No alerts' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ message: 'No admins' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const sent = [];
    for (const admin of admins) {
      const html = generateEmail(keyStatuses);
      const result = await sendEmail(admin.email, '🚨 API Key Alert', html);
      if (result.success) sent.push(admin.email);
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

function generateEmail(keys: any[]) {
  const invalid = keys.filter(k => !k.is_valid);
  const expiring = keys.filter(k => k.expires_at);
  
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif">
    <div style="max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#667eea;color:white;padding:30px;text-align:center">
        <h1>🚨 API Key Alert</h1>
      </div>
      <div style="background:#f9fafb;padding:30px">
        ${invalid.length > 0 ? `<h3>❌ Invalid Keys (${invalid.length})</h3>
        ${invalid.map(k => `<div style="background:white;padding:12px;margin:8px 0;border-left:4px solid #ef4444">
          <strong>${k.key_name}</strong><br>
          Type: ${k.key_type}<br>
          Health: ${k.health_score}%<br>
          ${k.last_error ? `Error: ${k.last_error}<br>` : ''}
        </div>`).join('')}` : ''}
        ${expiring.length > 0 ? `<h3>⚠️ Expiring Keys (${expiring.length})</h3>
        ${expiring.map(k => `<div style="background:white;padding:12px;margin:8px 0;border-left:4px solid #f59e0b">
          <strong>${k.key_name}</strong><br>
          Expires: ${new Date(k.expires_at).toLocaleDateString()}<br>
        </div>`).join('')}` : ''}
      </div>
    </div>
  </body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject }],
        from: { email: 'alerts@yourdomain.com', name: 'API Monitor' },
        content: [{ type: 'text/html', value: html }]
      })
    });
    return { success: response.ok };
  } catch (error) {
    return { success: false };
  }
}
