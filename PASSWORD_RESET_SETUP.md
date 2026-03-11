# Password Reset Flow Setup Guide

This guide explains how to set up and configure the complete password reset flow with email functionality.

## Overview

The password reset flow uses Supabase's built-in authentication system which:
- Generates secure reset tokens
- Sends emails via Supabase's email service (or custom SMTP)
- Handles token validation and expiration
- Provides secure password update functionality

## Flow Diagram

```
User Request → Supabase Auth → Email Sent → User Clicks Link → Password Update
     ↓              ↓              ↓              ↓                  ↓
  Email input   Token created   Reset email   Redirect to app   New password saved
```

## Setup Steps

### 1. Configure Redirect URLs in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **URL Configuration**
3. Add your redirect URLs:

```
# Development
http://localhost:5173/reset-password
http://localhost:3000/reset-password

# Production (replace with your actual domain)
https://yourdomain.com/reset-password
https://your-app.netlify.app/reset-password
```

### 2. Configure Email Templates (Optional)

For custom email templates, go to **Authentication** → **Email Templates** → **Reset Password**:

```html
<h2>Reset Your Password</h2>

<p>Hi there,</p>

<p>We received a request to reset your password. Click the button below to create a new password:</p>

<p>
  <a href="{{ .SiteURL }}/reset-password#access_token={{ .Token }}&type=recovery" 
     style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Reset Password
  </a>
</p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

### 3. Configure SMTP (Recommended for Production)

Supabase's default email service has rate limits (2 emails/hour). For production:

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. Enable custom SMTP
3. Configure with your email provider:

**Using Resend:**
```
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_your_api_key
Sender email: noreply@yourdomain.com
Sender name: Your App Name
```

**Using SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.your_api_key
Sender email: noreply@yourdomain.com
Sender name: Your App Name
```

### 4. Set Environment Variables

Add to your Supabase secrets (for edge functions):

```bash
# If using Resend API directly
supabase secrets set RESEND_API_KEY=re_your_api_key

# App URL for email links
supabase secrets set APP_URL=https://yourdomain.com
```

## How It Works

### Step 1: User Requests Password Reset

User enters their email in the `PasswordResetForm` component:

```typescript
// From AuthContext.tsx
const resetPassword = async (email: string) => {
  const siteUrl = window.location.origin;
  const redirectTo = `${siteUrl}/reset-password`;
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo
  });
  
  return { data, error };
};
```

### Step 2: Email Sent

Supabase sends an email with a secure link containing:
- `access_token` - Temporary authentication token
- `refresh_token` - For session refresh
- `type` - Set to "recovery"

### Step 3: User Clicks Link

When the user clicks the link, they're redirected to `/reset-password` with tokens in the URL hash:

```
https://yourapp.com/reset-password#access_token=xxx&type=recovery&...
```

### Step 4: Password Update

The `ResetPassword` page:
1. Detects the recovery mode via `onAuthStateChange` event
2. Shows the password reset form
3. Updates the password using `supabase.auth.updateUser()`

```typescript
// From AuthContext.tsx
const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  return { data, error };
};
```

## Components

### PasswordResetForm (`src/components/auth/PasswordResetForm.tsx`)

- Email input with validation
- Sends reset request via `resetPassword()`
- Shows success message with next steps

### ResetPassword Page (`src/pages/ResetPassword.tsx`)

- Validates recovery session
- Password strength indicator
- Requirements checklist
- Secure password update

## Security Features

1. **Token Expiration**: Reset links expire after 1 hour
2. **Single Use**: Tokens are invalidated after use
3. **Rate Limiting**: Supabase limits reset requests
4. **Password Strength**: Enforced minimum requirements
5. **Secure Transmission**: All data over HTTPS

## Testing

### Local Development

1. Start your dev server: `npm run dev`
2. Click "Forgot Password" on the sign-in form
3. Enter your email
4. Check your email (or Supabase logs if using default email)
5. Click the reset link
6. Enter a new password

### Check Supabase Logs

View authentication logs in Supabase Dashboard:
- **Authentication** → **Logs**
- Filter by "password_recovery"

## Troubleshooting

### "Invalid or expired link" Error

**Causes:**
- Link clicked after 1 hour
- Link already used
- Redirect URL not configured

**Solutions:**
1. Request a new reset link
2. Add redirect URL to Supabase settings
3. Check URL configuration matches exactly

### Email Not Received

**Causes:**
- Rate limit reached (2/hour on free tier)
- Email in spam folder
- SMTP not configured

**Solutions:**
1. Check spam/junk folder
2. Wait and try again
3. Configure custom SMTP
4. Check Supabase email logs

### "User not found" (Silent)

For security, the system doesn't reveal if an email exists. It always shows success message.

### Password Update Fails

**Causes:**
- Session expired
- Password doesn't meet requirements

**Solutions:**
1. Request new reset link
2. Use stronger password (8+ chars, mixed case, numbers, symbols)

## Custom Email Template (Edge Function)

If you want fully custom emails via Resend API, deploy this edge function:

```typescript
// supabase/functions/custom-password-reset/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, resetUrl, userName } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Your App <noreply@yourdomain.com>',
        to: [email],
        subject: 'Reset Your Password',
        html: `
          <h1>Reset Your Password</h1>
          <p>Hi ${userName || 'there'},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Related Files

- `src/contexts/AuthContext.tsx` - Auth context with reset functions
- `src/components/auth/PasswordResetForm.tsx` - Reset request form
- `src/pages/ResetPassword.tsx` - New password form
- `src/components/auth/AuthModal.tsx` - Modal containing auth forms
- `src/components/auth/SignInForm.tsx` - Sign in with forgot password link

## Checklist

- [ ] Redirect URLs configured in Supabase
- [ ] Email templates customized (optional)
- [ ] SMTP configured for production
- [ ] Test reset flow end-to-end
- [ ] Verify email delivery
- [ ] Check password requirements work
