export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, fullName, daysRemaining, trialEndsAt } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const subject = daysRemaining === 5 
      ? '⏰ 5 Days Left in Your Free Trial'
      : '🚨 Last Day of Your Free Trial!';

    const htmlContent = daysRemaining === 5 
      ? `
        <h2>Hi ${fullName || 'there'},</h2>
        <p>You have <strong>5 days remaining</strong> in your free trial.</p>
        <p>Your trial ends on <strong>${new Date(trialEndsAt).toLocaleDateString()}</strong>.</p>
        <p>Don't miss out on:</p>
        <ul>
          <li>AI-powered repair diagnostics</li>
          <li>Step-by-step repair guides</li>
          <li>Parts tracking and recommendations</li>
          <li>Maintenance reminders</li>
        </ul>
        <p><a href="${Deno.env.get('SITE_URL') || 'https://yoursite.com'}/dashboard" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade Now</a></p>
      `
      : `
        <h2>Hi ${fullName || 'there'},</h2>
        <p><strong>Today is the last day</strong> of your free trial!</p>
        <p>Your trial expires at midnight tonight.</p>
        <p>Subscribe now to continue enjoying:</p>
        <ul>
          <li>Unlimited AI repair assistance</li>
          <li>Access to video library</li>
          <li>Priority support</li>
          <li>Advanced analytics</li>
        </ul>
        <p><a href="${Deno.env.get('SITE_URL') || 'https://yoursite.com'}/dashboard" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Subscribe Now</a></p>
      `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: email,
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
