import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CriticalAlert {
  id: string;
  type: string;
  bucket_name: string;
  severity: string;
  message: string;
  details: Record<string, any>;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { alert } = await req.json() as { alert: CriticalAlert };

    // Log the critical alert
    await supabaseClient
      .from('storage_alerts')
      .insert({
        bucket_name: alert.bucket_name,
        alert_type: alert.type,
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        threshold_value: alert.details.threshold || 0,
        current_value: alert.details.current || 0,
        notified: true,
        notified_at: new Date().toISOString()
      });

    // Send email notification for critical alerts
    const emailHtml = `
      <h2>🚨 Critical Storage Alert</h2>
      <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>Bucket:</strong> ${alert.bucket_name}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <h3>Details:</h3>
      <ul>
        ${Object.entries(alert.details).map(([key, value]) => 
          `<li><strong>${key}:</strong> ${value}</li>`
        ).join('')}
      </ul>
      <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
      <hr>
      <p>Please take immediate action to prevent service disruption.</p>
    `;

    // Get admin emails
    const { data: admins } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];

    // Send email to all admins
    for (const email of adminEmails) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        },
        body: JSON.stringify({
          from: 'Storage Alerts <alerts@yourdomain.com>',
          to: email,
          subject: `🚨 CRITICAL: ${alert.message}`,
          html: emailHtml,
        }),
      });
    }

    // Send Slack notification if configured
    const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL');
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Critical Storage Alert*`,
          attachments: [{
            color: alert.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Bucket', value: alert.bucket_name, short: true },
              { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
              { title: 'Message', value: alert.message, short: false },
              { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: true }
            ]
          }]
        })
      });
    }

    // Send push notification if configured
    const { data: subscriptions } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (subscriptions && subscriptions.length > 0) {
      // Implementation for push notifications would go here
      // This would integrate with a service like Firebase Cloud Messaging
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Critical alert sent successfully',
        notified: adminEmails.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending critical alert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});