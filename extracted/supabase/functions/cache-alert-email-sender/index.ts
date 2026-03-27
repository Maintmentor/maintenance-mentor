export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { alertType, severity, message, threshold, currentValue, recipients } = await req.json();

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailContent = generateEmailContent(alertType, severity, message, threshold, currentValue);

    const emailPromises = recipients.map(async (email: string) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Cache Alerts <alerts@yourdomain.com>',
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });

      const result = await response.json();
      return { email, success: response.ok, result };
    });

    const results = await Promise.all(emailPromises);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function generateEmailContent(alertType: string, severity: string, message: string, threshold: number, currentValue: number) {
  const severityColor = severity === 'critical' ? '#dc2626' : '#f59e0b';
  const severityIcon = severity === 'critical' ? '🚨' : '⚠️';

  let title = '', description = '', recommendation = '';

  switch (alertType) {
    case 'low_hit_rate':
      title = 'Low Cache Hit Rate';
      description = `Hit rate: ${currentValue.toFixed(1)}%, threshold: ${threshold}%`;
      recommendation = 'Prewarm cache or review invalidation policies.';
      break;
    case 'high_response_time':
      title = 'High Response Time';
      description = `Response time: ${Math.round(currentValue)}ms, threshold: ${threshold}ms`;
      recommendation = 'Check storage performance and optimize images.';
      break;
    case 'storage_limit':
      title = 'Storage Limit Reached';
      description = `Usage: ${(currentValue / (1024 * 1024)).toFixed(2)}MB`;
      recommendation = 'Run cleanup or increase storage allocation.';
      break;
    case 'api_errors':
      title = 'High API Error Rate';
      description = `${Math.round(currentValue)} errors, threshold: ${threshold}`;
      recommendation = 'Check API credentials and quota limits.';
      break;
  }

  const html = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:${severityColor};color:white;padding:20px;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.alert-box{background:white;border-left:4px solid ${severityColor};padding:15px;margin:20px 0}.button{background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:20px}</style></head><body><div class="container"><div class="header"><h1>${severityIcon} ${title}</h1><p>Severity: ${severity.toUpperCase()}</p></div><div class="content"><div class="alert-box"><h3>Alert Details</h3><p><strong>Message:</strong> ${message}</p><p><strong>Time:</strong> ${new Date().toLocaleString()}</p></div><h3>Metrics</h3><p>${description}</p><h3>Recommended Action</h3><p>${recommendation}</p><a href="https://yourdomain.com/admin" class="button">View Dashboard</a></div></div></body></html>`;

  return { subject: `${severityIcon} ${severity.toUpperCase()}: ${title}`, html };
}
