# Custom SMTP Configuration Guide

This guide explains how to configure a custom SMTP provider (Resend, SendGrid, Mailgun, etc.) in Supabase for production email delivery.

## Why Configure Custom SMTP?

Supabase's default email service has significant limitations:
- **Rate limit**: Only 2 emails per hour
- **No custom branding**: Generic sender address
- **Limited deliverability**: May land in spam folders

For production applications, you need a custom SMTP provider.

---

## Quick Setup (5 Minutes)

### Step 1: Get Your SMTP Credentials

#### Option A: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain for testing)
3. Create an API key in the dashboard
4. Use these SMTP settings:

```
Host: smtp.resend.com
Port: 465 (SSL) or 587 (TLS)
Username: resend
Password: re_your_api_key_here
```

#### Option B: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key with "Mail Send" permissions
3. Use these SMTP settings:

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.your_api_key_here
```

#### Option C: Mailgun

1. Sign up at [mailgun.com](https://mailgun.com)
2. Verify your domain
3. Get SMTP credentials from domain settings
4. Use these SMTP settings:

```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@your-domain.mailgun.org
Password: your_mailgun_password
```

#### Option D: Amazon SES

1. Set up Amazon SES in AWS Console
2. Verify your domain and email addresses
3. Create SMTP credentials in SES
4. Use these SMTP settings:

```
Host: email-smtp.us-east-1.amazonaws.com (or your region)
Port: 587
Username: your_ses_smtp_username
Password: your_ses_smtp_password
```

---

### Step 2: Configure Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Project Settings** → **Authentication**
4. Scroll down to **SMTP Settings**
5. Toggle **Enable Custom SMTP** ON
6. Fill in your credentials:

| Field | Value |
|-------|-------|
| **Sender email** | noreply@yourdomain.com |
| **Sender name** | Your App Name |
| **Host** | smtp.resend.com (or your provider) |
| **Port** | 465 or 587 |
| **Username** | resend (or your username) |
| **Password** | Your API key or password |

7. Click **Save**

### Step 3: Test Email Delivery

1. Go to **Authentication** → **Users**
2. Click **Invite user**
3. Enter a test email address
4. Check if the email arrives in your inbox

---

## Detailed Provider Setup

### Resend Setup (Recommended)

Resend is the recommended provider for its simplicity, excellent deliverability, and developer-friendly experience.

#### 1. Create Account & API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Give it a name (e.g., "Supabase SMTP")
5. Copy the key (starts with `re_`)

```
Your API key: re_123abc456def789ghi...
```

#### 2. Domain Verification (Required for Production)

For production emails to be delivered reliably:

1. Go to Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider:

**Required DNS Records:**

| Type | Name | Value |
|------|------|-------|
| TXT | @ or yourdomain.com | `v=spf1 include:_spf.resend.com ~all` |
| CNAME | resend._domainkey | `resend._domainkey.resend.com` |
| TXT | _dmarc | `v=DMARC1; p=none;` |

5. Wait for verification (usually 1-5 minutes)
6. Once verified, you can send from any email @yourdomain.com

#### 3. Configure in Supabase

```
Sender email: noreply@yourdomain.com
Sender name: Your App Name
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_your_api_key
Minimum interval: 0 (or leave default)
```

### SendGrid Setup

#### 1. Create API Key

1. Go to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Select **Restricted Access**
5. Enable **Mail Send** → **Full Access**
6. Click **Create & View**
7. Copy the key (starts with `SG.`)

#### 2. Sender Verification

1. Go to **Settings** → **Sender Authentication**
2. Choose **Domain Authentication** (recommended) or **Single Sender Verification**
3. For domain auth, add the DNS records provided
4. Wait for verification

#### 3. Configure in Supabase

```
Sender email: noreply@yourdomain.com
Sender name: Your App Name
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.your_full_api_key_here
```

---

## Email Templates

### Customize Supabase Email Templates

1. Go to **Authentication** → **Email Templates**
2. Select the template to customize:
   - **Confirm signup** - Email verification for new users
   - **Invite user** - Admin invitations
   - **Magic Link** - Passwordless login
   - **Change Email Address** - Email change confirmation
   - **Reset Password** - Password reset requests

### Password Reset Template Example

```html
<h2>Reset Your Password</h2>

<p>Hi {{ .Email }},</p>

<p>We received a request to reset your password for your account.</p>

<p>Click the button below to set a new password:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .SiteURL }}/reset-password#access_token={{ .Token }}&type=recovery"
     style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; 
            color: white; text-decoration: none; border-radius: 8px; font-weight: 600;
            font-size: 16px;">
    Reset Password
  </a>
</p>

<p><strong>This link will expire in 1 hour.</strong></p>

<p style="color: #666; font-size: 14px; margin-top: 30px;">
  If you didn't request a password reset, you can safely ignore this email. 
  Your password will remain unchanged.
</p>

<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

<p style="color: #999; font-size: 12px;">
  © 2025 Your Company Name. All rights reserved.
</p>
```

### Email Verification Template Example

```html
<h2>Verify Your Email Address</h2>

<p>Hi {{ .Email }},</p>

<p>Thanks for signing up! Please verify your email address to complete your registration.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; padding: 14px 28px; background-color: #10b981; 
            color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
    Verify Email
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  This link will expire in 24 hours.
</p>
```

---

## Edge Function for Custom Emails (Optional)

For complete control over email content and styling, you can use an edge function with the Resend API directly.

### Set Up Secrets

```bash
# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_your_api_key

# Set app configuration
supabase secrets set APP_URL=https://yourdomain.com
supabase secrets set APP_NAME="Your App Name"
supabase secrets set SENDER_EMAIL=noreply@yourdomain.com
supabase secrets set SUPPORT_EMAIL=support@yourdomain.com
```

### Edge Function Code

Create `supabase/functions/send-password-reset-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
  userName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const appName = Deno.env.get('APP_NAME') || 'Your App';
    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'noreply@yourdomain.com';

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const { email, resetUrl, userName } = await req.json() as PasswordResetRequest;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${appName} <${senderEmail}>`,
        to: [email],
        subject: `Reset Your ${appName} Password`,
        html: `
          <h2>Reset Your Password</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; 
                      color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset Password
            </a>
          </p>
          <p><strong>This link expires in 1 hour.</strong></p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Deploy the Function

```bash
supabase functions deploy send-password-reset-email
```

---

## Troubleshooting

### Email Not Sending

| Issue | Solution |
|-------|----------|
| SMTP credentials incorrect | Double-check username and password |
| Wrong port | Try both 465 (SSL) and 587 (TLS) |
| Sender email not verified | Verify domain or single sender |
| Rate limit exceeded | Wait or upgrade plan |

### Email Going to Spam

1. **Verify your domain** - Add SPF, DKIM, and DMARC records
2. **Use consistent sender** - Always use the same from address
3. **Avoid spam triggers** - No ALL CAPS or excessive punctuation
4. **Include proper headers** - Ensure reply-to is set

### Check Supabase Logs

1. Go to **Logs** → **Edge Functions** (if using edge function)
2. Or check **Authentication** → **Logs** for auth emails
3. Filter by time range to find errors

### Rate Limits by Provider

| Provider | Free Tier Limit |
|----------|-----------------|
| Supabase (default) | 2 emails/hour |
| Resend | 100 emails/day, 3,000/month |
| SendGrid | 100 emails/day |
| Mailgun | 5,000 emails/month (first 3 months) |
| Amazon SES | 62,000 emails/month (from EC2) |

---

## Security Best Practices

1. **Never commit API keys** - Use environment variables and secrets
2. **Rotate keys regularly** - Every 90 days recommended
3. **Use least privilege** - Only grant necessary permissions
4. **Monitor usage** - Set up alerts for unusual activity
5. **Enable 2FA** - On your email provider account

---

## Verification Checklist

- [ ] SMTP provider account created
- [ ] API key or credentials generated
- [ ] Domain verified (for production)
- [ ] DNS records added (SPF, DKIM, DMARC)
- [ ] Supabase SMTP settings configured
- [ ] Test email sent successfully
- [ ] Email templates customized
- [ ] Edge function secrets set (if using)
- [ ] Production sender email verified

---

## Quick Reference Card

### Resend SMTP Settings
```
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_xxxxx (your API key)
```

### SendGrid SMTP Settings
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.xxxxx (your API key)
```

### Mailgun SMTP Settings
```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@yourdomain.mailgun.org
Password: (from Mailgun dashboard)
```

### Required DNS Records for Domain Verification
```
SPF:   TXT  @  "v=spf1 include:_spf.resend.com ~all"
DKIM:  CNAME resend._domainkey  resend._domainkey.resend.com
DMARC: TXT  _dmarc  "v=DMARC1; p=none;"
```

---

## Related Documentation

- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid SMTP Guide](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Mailgun SMTP Setup](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)
