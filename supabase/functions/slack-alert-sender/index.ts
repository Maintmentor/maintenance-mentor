export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keyName, alertType, healthScore, errorMessage, lastValidated, expiresAt } = await req.json();

    // Fetch active Slack webhook configurations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const configResponse = await fetch(`${supabaseUrl}/rest/v1/slack_webhook_config?enabled=eq.true&alert_types=cs.{${alertType}}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const configs = await configResponse.json();

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No active Slack webhooks configured' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const results = [];

    for (const config of configs) {
      const color = alertType === 'critical' ? '#DC2626' : alertType === 'warning' ? '#F59E0B' : '#3B82F6';
      const emoji = alertType === 'critical' ? '🚨' : alertType === 'warning' ? '⚠️' : 'ℹ️';

      const slackMessage = {
        channel: config.channel_name,
        username: 'API Key Monitor',
        icon_emoji: ':key:',
        attachments: [{
          color: color,
          title: `${emoji} API Key Alert: ${keyName}`,
          fields: [
            {
              title: 'Alert Type',
              value: alertType.toUpperCase(),
              short: true
            },
            {
              title: 'Health Score',
              value: `${healthScore}/100`,
              short: true
            },
            {
              title: 'Status',
              value: errorMessage || 'Key validation failed',
              short: false
            },
            {
              title: 'Last Validated',
              value: new Date(lastValidated).toLocaleString(),
              short: true
            },
            ...(expiresAt ? [{
              title: 'Expires At',
              value: new Date(expiresAt).toLocaleString(),
              short: true
            }] : [])
          ],
          footer: 'API Key Validation System',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      try {
        const slackResponse = await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });

        const status = slackResponse.ok ? 'sent' : 'failed';
        const error = slackResponse.ok ? null : await slackResponse.text();

        // Log notification
        await fetch(`${supabaseUrl}/rest/v1/slack_notifications`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook_config_id: config.id,
            alert_type: alertType,
            key_name: keyName,
            message: JSON.stringify(slackMessage),
            status: status,
            error_message: error
          })
        });

        results.push({ channel: config.channel_name, status, error });
      } catch (error) {
        results.push({ channel: config.channel_name, status: 'failed', error: error.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});