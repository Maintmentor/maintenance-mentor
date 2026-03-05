import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get unnotified alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('storage_alerts')
      .select('*')
      .eq('notification_sent', false)
      .order('created_at', { ascending: false });

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new alerts to notify'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Group alerts by severity
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');
    const mediumAlerts = alerts.filter(a => a.severity === 'medium');
    const lowAlerts = alerts.filter(a => a.severity === 'low');

    // Build email content
    let emailHtml = `
      <h2>Storage Alert Summary</h2>
      <p>The following storage alerts have been detected:</p>
    `;

    if (criticalAlerts.length > 0) {
      emailHtml += `
        <h3 style="color: #dc2626;">🚨 Critical Alerts (${criticalAlerts.length})</h3>
        <ul>
          ${criticalAlerts.map(a => `
            <li>
              <strong>${a.title}</strong><br/>
              ${a.message}<br/>
              <small>Bucket: ${a.bucket_name || 'N/A'} | Time: ${new Date(a.created_at).toLocaleString()}</small>
            </li>
          `).join('')}
        </ul>
      `;
    }

    if (highAlerts.length > 0) {
      emailHtml += `
        <h3 style="color: #ea580c;">⚠️ High Priority Alerts (${highAlerts.length})</h3>
        <ul>
          ${highAlerts.map(a => `
            <li>
              <strong>${a.title}</strong><br/>
              ${a.message}<br/>
              <small>Bucket: ${a.bucket_name || 'N/A'} | Time: ${new Date(a.created_at).toLocaleString()}</small>
            </li>
          `).join('')}
        </ul>
      `;
    }

    if (mediumAlerts.length > 0) {
      emailHtml += `
        <h3 style="color: #f59e0b;">📊 Medium Priority Alerts (${mediumAlerts.length})</h3>
        <ul>
          ${mediumAlerts.map(a => `
            <li>
              <strong>${a.title}</strong><br/>
              ${a.message}<br/>
              <small>Bucket: ${a.bucket_name || 'N/A'} | Time: ${new Date(a.created_at).toLocaleString()}</small>
            </li>
          `).join('')}
        </ul>
      `;
    }

    if (lowAlerts.length > 0) {
      emailHtml += `
        <h3 style="color: #3b82f6;">ℹ️ Low Priority Alerts (${lowAlerts.length})</h3>
        <ul>
          ${lowAlerts.map(a => `
            <li>
              <strong>${a.title}</strong><br/>
              ${a.message}<br/>
              <small>Bucket: ${a.bucket_name || 'N/A'} | Time: ${new Date(a.created_at).toLocaleString()}</small>
            </li>
          `).join('')}
        </ul>
      `;
    }

    emailHtml += `
      <hr/>
      <p><small>This is an automated notification from your storage monitoring system.</small></p>
    `;

    // Get admin emails
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    if (adminsError) throw adminsError;

    const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];
    if (adminEmails.length === 0) {
      adminEmails.push('admin@example.com'); // Fallback email
    }

    // Send email via SendGrid
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: adminEmails.map(email => ({ email }))
        }],
        from: { email: 'alerts@repairshop.com', name: 'Storage Monitor' },
        subject: criticalAlerts.length > 0 ? '🚨 Critical Storage Alert' :
                 highAlerts.length > 0 ? '⚠️ High Priority Storage Alert' :
                 'Storage Alert Notification',
        content: [{
          type: 'text/html',
          value: emailHtml
        }]
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    // Mark alerts as notified
    const alertIds = alerts.map(a => a.id);
    const { error: updateError } = await supabase
      .from('storage_alerts')
      .update({ 
        notification_sent: true,
        notification_sent_at: new Date().toISOString()
      })
      .in('id', alertIds);

    if (updateError) console.error('Error updating alerts:', updateError);

    return new Response(JSON.stringify({
      success: true,
      alertsNotified: alerts.length,
      recipients: adminEmails
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Storage alert notifier error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});