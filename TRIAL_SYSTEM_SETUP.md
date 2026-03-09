# Trial Expiration System Documentation

## Overview
Complete 7-day trial system with automatic tracking, countdown timers, email reminders, and access restrictions.

## Features Implemented

### 1. Trial Tracking
- **Duration**: 7 days from signup
- **Automatic Start**: Trial begins immediately upon user registration
- **Database Fields**:
  - `trial_ends_at`: Timestamp when trial expires
  - `subscription_status`: 'trial', 'active', 'expired'
  - `trial_reminder_day5_sent`: Boolean flag for day 5 reminder
  - `trial_reminder_day7_sent`: Boolean flag for day 7 reminder

### 2. Countdown Timer
- **Location**: Dashboard (visible to trial users only)
- **Component**: `TrialCountdownBanner.tsx`
- **Features**:
  - Shows days remaining in trial
  - Changes color to orange when 2 days or less remain
  - Shows hours remaining on last day
  - Prominent "Upgrade Now" button
  - Auto-updates every minute

### 3. Trial Expiration Modal
- **Component**: `TrialExpirationModal.tsx`
- **Triggers**: Automatically when trial expires
- **Features**:
  - Blocks access with modal overlay
  - Clear messaging about expired trial
  - Direct link to pricing/subscription page

### 4. Access Restrictions
- **Component**: `TrialAccessGate.tsx`
- **Protected Features**: AI Chat (RepairDashboard)
- **Logic**:
  - Allows access if: trial active OR paid subscription
  - Blocks access if: trial expired
  - Shows upgrade prompt when blocked

### 5. Email Reminders
- **Day 5 (2 days remaining)**: Warning email
- **Day 7 (last day)**: Final reminder email
- **Service**: `trialReminderService.ts`
- **Edge Function**: `trial-reminder-email` (needs deployment)

## Setup Instructions

### 1. Database is Ready
All necessary columns and indexes have been created:
```sql
- trial_ends_at
- trial_reminder_day5_sent
- trial_reminder_day7_sent
- trial_reminder_day5_sent_at
- trial_reminder_day7_sent_at
```

### 2. Deploy Email Function (Manual Step Required)
The trial reminder email function needs to be deployed:
```bash
supabase functions deploy trial-reminder-email
```

### 3. Set Up Scheduled Job
To send automatic email reminders, set up a cron job or scheduled task to call:
```javascript
import { checkAndSendTrialReminders } from '@/services/trialReminderService';

// Run this daily
await checkAndSendTrialReminders();
```

Options for scheduling:
- **Vercel Cron Jobs** (if using Vercel)
- **GitHub Actions** (scheduled workflow)
- **External service** (like EasyCron, cron-job.org)
- **Supabase Edge Function** with pg_cron extension

### 4. Automatic Trial Expiration
Database function `check_and_expire_trials()` automatically expires trials.
Run periodically via:
- pg_cron extension in Supabase
- External scheduler calling the function
- Frontend checks on auth state change (already implemented)

## User Flow

### New User Signup
1. User creates account
2. Profile created with `subscription_status: 'trial'`
3. `trial_ends_at` set to 7 days from now
4. User gets full access to all features

### During Trial (Days 1-4)
1. User sees countdown banner in dashboard
2. Banner shows days remaining
3. "Upgrade Now" button always visible
4. Full access to AI chat and all features

### Day 5 (2 Days Remaining)
1. Countdown banner turns orange (urgent)
2. Email reminder sent automatically
3. `trial_reminder_day5_sent` flag set to true
4. User still has full access

### Day 7 (Last Day)
1. Banner shows hours remaining
2. Final email reminder sent
3. `trial_reminder_day7_sent` flag set to true
4. User still has full access until midnight

### Trial Expired
1. `subscription_status` changed to 'expired'
2. TrialExpirationModal appears on login
3. AI Chat blocked by TrialAccessGate
4. User must upgrade to continue

## Components

### TrialCountdownBanner
```typescript
// Shows in Dashboard.tsx
<TrialCountdownBanner />
```
- Updates every minute
- Color-coded urgency
- Direct upgrade link

### TrialExpirationModal
```typescript
// Shows in Dashboard.tsx
<TrialExpirationModal />
```
- Auto-appears when expired
- Blocks interaction
- Links to subscription page

### TrialAccessGate
```typescript
// Wraps protected features
<TrialAccessGate>
  <RepairDashboard />
</TrialAccessGate>
```
- Checks subscription status
- Shows upgrade prompt if expired
- Allows trial and paid users

## Email Templates

### Day 5 Reminder
- Subject: "⏰ Your Trial Ends in 2 Days - Upgrade Now!"
- Content: Feature highlights, upgrade CTA
- Sent when 2 days remain

### Day 7 Reminder
- Subject: "⏰ Last Day of Your Free Trial - Don't Lose Access!"
- Content: Urgent messaging, feature list, upgrade CTA
- Sent on last day

## Testing

### Test Trial Expiration
1. Create test user
2. Manually set `trial_ends_at` to past date:
```sql
UPDATE profiles 
SET trial_ends_at = NOW() - INTERVAL '1 day',
    subscription_status = 'trial'
WHERE email = 'test@example.com';
```
3. Login and verify:
   - Modal appears
   - AI Chat blocked
   - Upgrade prompts shown

### Test Countdown Timer
1. Set trial to expire soon:
```sql
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '2 days'
WHERE email = 'test@example.com';
```
2. Check dashboard shows orange banner
3. Verify countdown updates

## Maintenance

### Monitor Trial Users
```sql
SELECT email, trial_ends_at, subscription_status,
       trial_reminder_day5_sent, trial_reminder_day7_sent
FROM profiles
WHERE subscription_status = 'trial'
ORDER BY trial_ends_at;
```

### Check Expired Trials
```sql
SELECT COUNT(*) 
FROM profiles 
WHERE subscription_status = 'expired';
```

### Manually Extend Trial
```sql
UPDATE profiles
SET trial_ends_at = NOW() + INTERVAL '7 days',
    subscription_status = 'trial'
WHERE email = 'user@example.com';
```

## Future Enhancements
1. Trial extension for special cases
2. Different trial lengths per plan
3. Trial usage analytics
4. A/B testing trial durations
5. Custom trial periods for partnerships
