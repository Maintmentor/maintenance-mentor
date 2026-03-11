# Trial Reminder Email System Deployment Guide

## Overview
Automated system that sends trial reminder emails at day 5 and day 7 (last day) of the 7-day trial period.

## Components

### 1. Edge Function: `trial-reminder-email`
Located at: `supabase/functions/trial-reminder-email/index.ts`

**Deploy the function:**
```bash
supabase functions deploy trial-reminder-email
```

**Test the function:**
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/trial-reminder-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "daysRemaining": 5,
    "trialEndsAt": "2025-10-13T00:00:00Z"
  }'
```

### 2. GitHub Actions Scheduled Job
Located at: `.github/workflows/trial-reminders.yml`

**Schedule:** Runs daily at 9:00 AM UTC

**Required GitHub Secrets:**
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

**Manual Trigger:**
You can manually trigger the workflow from the Actions tab in GitHub.

### 3. Alternative: Vercel Cron (if using Vercel)

Create `api/cron/trial-reminders.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Run the trial reminder check logic here
  // (same as in GitHub Actions)

  return new Response('OK', { status: 200 });
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/trial-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

## Email Configuration

### Resend Setup
1. Sign up at https://resend.com
2. Verify your domain
3. Get your API key
4. Add to Supabase secrets:
```bash
supabase secrets set RESEND_API_KEY=your_api_key_here
```

### Update Email Template
Edit `supabase/functions/trial-reminder-email/index.ts` to customize:
- Email subject lines
- HTML content
- Call-to-action links
- Branding

## Testing

### Test Day 5 Reminder
```bash
# Set a user's trial to end in 5 days
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '5 days',
    trial_reminder_day5_sent = false
WHERE email = 'test@example.com';
```

### Test Day 7 (Last Day) Reminder
```bash
# Set a user's trial to end in 1 day
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '1 day',
    trial_reminder_day7_sent = false
WHERE email = 'test@example.com';
```

Then manually trigger the GitHub Action or run locally.

## Monitoring

### Check Sent Reminders
```sql
SELECT 
  email,
  trial_ends_at,
  trial_reminder_day5_sent,
  trial_reminder_day7_sent,
  subscription_status
FROM profiles
WHERE subscription_status = 'trialing'
ORDER BY trial_ends_at;
```

### View Logs
- **GitHub Actions**: Check the Actions tab in your repository
- **Supabase Edge Function**: View logs in Supabase Dashboard > Edge Functions

## Troubleshooting

### Emails Not Sending
1. Verify RESEND_API_KEY is set in Supabase secrets
2. Check domain verification in Resend dashboard
3. Review edge function logs for errors
4. Ensure "from" email address is verified

### Reminders Not Triggering
1. Verify GitHub secrets are set correctly
2. Check GitHub Actions is enabled for your repository
3. Review workflow run logs in Actions tab
4. Ensure profiles have correct trial_ends_at dates

### Duplicate Emails
The system prevents duplicates by checking:
- `trial_reminder_day5_sent` flag
- `trial_reminder_day7_sent` flag

These flags are set to `true` after successful email delivery.

## Production Checklist

- [ ] Deploy trial-reminder-email edge function
- [ ] Set RESEND_API_KEY in Supabase secrets
- [ ] Verify domain in Resend
- [ ] Add GitHub secrets (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Test with a dummy user account
- [ ] Monitor first scheduled run
- [ ] Set up error alerting (optional)
