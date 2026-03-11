import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  token: string;
  userName?: string;
  action: 'send' | 'resend';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { to, token, userName, action } = await req.json() as EmailRequest;
    
    // Construct verification URL
    const verificationUrl = `${supabaseUrl.replace('.supabase.co', '')}/verify-email?token=${token}`;
    
    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .code { background: #f0f0f0; padding: 15px; border-radius: 5px; font-size: 20px; letter-spacing: 3px; text-align: center; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email Address</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>
              <p>Thank you for signing up! Please verify your email address to complete your registration and unlock all features.</p>
              
              <p><strong>Your verification code is:</strong></p>
              <div class="code">${token.substring(0, 6).toUpperCase()}</div>
              
              <p>Or click the button below to verify automatically:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Your Company. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send email using Resend API if configured
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'noreply@yourdomain.com',
          to: [to],
          subject: action === 'resend' ? 'New Verification Code' : 'Verify Your Email Address',
          html: emailHtml,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email via Resend');
      }
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify({ success: true, messageId: data.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Fallback: Log email details (for development)
      console.log('Email would be sent to:', to);
      console.log('Verification token:', token);
      console.log('Verification URL:', verificationUrl);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email logged (Resend API not configured)',
          token: token.substring(0, 6).toUpperCase(),
          url: verificationUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});