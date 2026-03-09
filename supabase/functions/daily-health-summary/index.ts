export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get users who want daily summaries
    const configResponse = await fetch(
      `${supabaseUrl}/rest/v1/alert_configurations?enabled=eq.true&daily_summary=eq.true`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const configs = await configResponse.json();

    // Get alerts from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const alertsResponse = await fetch(
      `${supabaseUrl}/rest/v1/health_check_alerts?created_at=gte.${yesterday}&order=created_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const alerts = await alertsResponse.json();

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const infoCount = alerts.filter(a => a.severity === 'info').length;

    // Send summary emails
    const emailPromises = configs.map(async (config) => {
      const emailHtml = `
        <h2>📊 Daily Health Check Summary</h2>
        <p><strong>Period:</strong> Last 24 hours</p>
        <h3>Summary</h3>
        <ul>
          <li>🔴 Critical Alerts: ${criticalCount}</li>
          <li>🟡 Warning Alerts: ${warningCount}</li>
          <li>🔵 Info Alerts: ${infoCount}</li>
          <li>✅ Total Alerts: ${alerts.length}</li>
        </ul>
        ${alerts.length > 0 ? `
          <h3>Recent Alerts</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px;">Time</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Severity</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Function</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Message</th>
            </tr>
            ${alerts.slice(0, 10).map(alert => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(alert.created_at).toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${alert.severity}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${alert.function_name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${alert.message}</td>
              </tr>
            `).join('')}
          </table>
        ` : '<p>No alerts in the last 24 hours. All systems operational! ✅</p>'}
      `;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'alerts@repairai.app',
          to: config.email,
          subject: `Daily Health Summary - ${new Date().toLocaleDateString()}`,
          html: emailHtml
        })
      });

      return { email: config.email, success: response.ok };
    });

    const results = await Promise.all(emailPromises);

    return new Response(JSON.stringify({ 
      success: true,
      summariesSent: results.filter(r => r.success).length,
      totalAlerts: alerts.length,
      results 
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
