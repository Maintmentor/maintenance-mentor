export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { severity, functionName, message, details } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Get alert configurations from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const configResponse = await fetch(`${supabaseUrl}/rest/v1/alert_configurations?enabled=eq.true`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const configs = await configResponse.json();
    const recipients = configs.filter(c => {
      if (severity === 'critical') return c.critical_alerts;
      if (severity === 'warning') return c.warning_alerts;
      if (severity === 'info') return c.info_alerts;
      return false;
    });

    // Create alert record
    const alertResponse = await fetch(`${supabaseUrl}/rest/v1/health_check_alerts`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        function_name: functionName,
        severity,
        message,
        details
      })
    });

    const alert = await alertResponse.json();
    const alertId = alert[0]?.id;

    // Send emails
    const emailPromises = recipients.map(async (config) => {
      const emailHtml = `
        <h2>🚨 Health Check Alert: ${severity.toUpperCase()}</h2>
        <p><strong>Function:</strong> ${functionName}</p>
        <p><strong>Severity:</strong> ${severity}</p>
        <p><strong>Message:</strong> ${message}</p>
        ${details ? `<p><strong>Details:</strong> ${JSON.stringify(details, null, 2)}</p>` : ''}
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'alerts@repairai.app',
            to: config.email,
            subject: `[${severity.toUpperCase()}] ${functionName} Alert`,
            html: emailHtml
          })
        });

        const result = await response.json();
        
        // Log to alert_history
        await fetch(`${supabaseUrl}/rest/v1/alert_history`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            alert_id: alertId,
            recipient_email: config.email,
            status: response.ok ? 'sent' : 'failed',
            error_message: response.ok ? null : JSON.stringify(result)
          })
        });

        return { email: config.email, success: response.ok };
      } catch (error) {
        return { email: config.email, success: false, error: error.message };
      }
    });


    // Send Slack notifications
    const slackConfigs = recipients.filter(c => c.slack_enabled && c.slack_webhook_url);
    const slackPromises = slackConfigs.map(async (config) => {
      try {
        const slackResponse = await fetch(`${supabaseUrl}/functions/v1/slack-alert-sender`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            webhookUrl: config.slack_webhook_url,
            channel: config.slack_channel || '#alerts',
            severity,
            title: `${functionName} Alert`,
            message,
            functionName,
            details
          })
        });

        const slackResult = await slackResponse.json();

        // Log to slack_notifications
        await fetch(`${supabaseUrl}/rest/v1/slack_notifications`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            alert_id: alertId,
            webhook_url: config.slack_webhook_url,
            channel: config.slack_channel || '#alerts',
            severity,
            message,
            status: slackResponse.ok ? 'sent' : 'failed',
            error_message: slackResponse.ok ? null : JSON.stringify(slackResult)
          })
        });

        return { channel: config.slack_channel, success: slackResponse.ok };
      } catch (error) {
        return { channel: config.slack_channel, success: false, error: error.message };
      }
    });

    const slackResults = await Promise.all(slackPromises);

    const results = await Promise.all(emailPromises);


    return new Response(JSON.stringify({ 
      success: true, 
      alertId,
      emailsSent: results.filter(r => r.success).length,
      slackSent: slackResults.filter(r => r.success).length,
      emailResults: results,
      slackResults
    }), {

      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
