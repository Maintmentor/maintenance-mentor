# Health Check Email Notification System

## Overview
Automated email notification system for health check alerts with severity levels, customizable thresholds, and daily summary reports.

## Features

### 1. Alert Severity Levels
- **Critical**: System failures, API outages, edge function errors
- **Warning**: Performance degradation, high latency, partial failures
- **Info**: Informational messages, successful recoveries

### 2. Email Notifications
- Real-time alerts via Resend API
- Customizable alert preferences per recipient
- Daily summary reports
- Alert history tracking

### 3. Admin Dashboard
- Configure alert recipients
- Set alert level preferences (critical/warning/info)
- Enable/disable daily summaries
- View alert history
- Resolve alerts

## Setup Instructions

### Step 1: Run Database Migration
```bash
# Apply the migration to create required tables
supabase db push
```

Or manually run the SQL in `supabase/migrations/20250122_health_check_alerts.sql`

### Step 2: Deploy Edge Functions
```bash
# Deploy the alert sender function
supabase functions deploy health-check-alert-sender

# Deploy the daily summary function
supabase functions deploy daily-health-summary
```

### Step 3: Configure Alert Recipients
1. Navigate to Admin Dashboard → Health tab
2. Click on "Alert Configuration" tab
3. Add email addresses for alert recipients
4. Configure preferences:
   - Enable/disable alerts
   - Select severity levels (critical/warning/info)
   - Enable daily summaries
   - Set summary delivery time

### Step 4: Set Up Automated Monitoring
The GitHub Actions workflow `.github/workflows/health-check-monitoring.yml` runs every 15 minutes to:
- Check system health
- Send alerts on failures
- Track uptime

Configure GitHub secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 5: Schedule Daily Summaries
Set up a cron job or use Supabase scheduled functions to call:
```bash
curl -X POST \
  "https://YOUR_PROJECT.supabase.co/functions/v1/daily-health-summary" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Database Schema

### health_check_alerts
Stores all system alerts:
- `id`: UUID primary key
- `function_name`: Name of the affected function/service
- `severity`: critical | warning | info
- `message`: Alert message
- `details`: JSON with additional context
- `resolved`: Boolean flag
- `created_at`: Timestamp
- `resolved_at`: Resolution timestamp

### alert_configurations
Manages alert recipient preferences:
- `id`: UUID primary key
- `user_id`: Reference to auth.users
- `email`: Recipient email address
- `enabled`: Master enable/disable
- `critical_alerts`: Receive critical alerts
- `warning_alerts`: Receive warning alerts
- `info_alerts`: Receive info alerts
- `daily_summary`: Receive daily summaries
- `summary_time`: Time to send daily summary (HH:MM format)

### alert_history
Tracks email delivery:
- `id`: UUID primary key
- `alert_id`: Reference to health_check_alerts
- `recipient_email`: Email address
- `sent_at`: Timestamp
- `status`: sent | failed
- `error_message`: Error details if failed

## API Usage

### Send Alert
```typescript
const { data, error } = await supabase.functions.invoke('health-check-alert-sender', {
  body: {
    severity: 'critical',
    functionName: 'repair-diagnostic',
    message: 'Function timeout exceeded',
    details: {
      timeout: 30000,
      actualDuration: 45000
    }
  }
});
```

### Trigger Daily Summary
```typescript
const { data, error } = await supabase.functions.invoke('daily-health-summary', {
  body: {}
});
```

## Alert Thresholds

### Critical Alerts (Automatic)
- Edge function failures
- API dependency outages (OpenAI, Stripe, Resend)
- Database connection failures
- Authentication system errors

### Warning Alerts (Automatic)
- High response times (>5s)
- Rate limit approaching
- Cache miss rate >50%
- Memory usage >80%

### Info Alerts (Manual)
- Successful deployments
- System maintenance notifications
- Feature updates

## Email Templates

### Alert Email
```
Subject: [CRITICAL] repair-diagnostic Alert

🚨 Health Check Alert: CRITICAL

Function: repair-diagnostic
Severity: critical
Message: Function timeout exceeded
Details: {...}
Time: 2025-01-22T14:30:00Z
```

### Daily Summary Email
```
Subject: Daily Health Summary - 01/22/2025

📊 Daily Health Check Summary

Period: Last 24 hours

Summary:
🔴 Critical Alerts: 2
🟡 Warning Alerts: 5
🔵 Info Alerts: 1
✅ Total Alerts: 8

Recent Alerts:
[Table with time, severity, function, message]
```

## Monitoring Dashboard

Access the dashboard at `/admin` → Health tab:

1. **System Status**: Real-time health of all services
2. **Alert Configuration**: Manage recipients and preferences
3. **Alert History**: View and resolve past alerts

## Best Practices

1. **Alert Fatigue Prevention**
   - Set appropriate thresholds
   - Use info level sparingly
   - Group related alerts
   - Implement alert deduplication

2. **Response Procedures**
   - Critical: Immediate response required
   - Warning: Investigate within 1 hour
   - Info: Review during business hours

3. **Testing**
   - Test alert delivery regularly
   - Verify email deliverability
   - Check spam filters
   - Validate recipient lists

4. **Maintenance**
   - Review alert history monthly
   - Update thresholds based on patterns
   - Clean up resolved alerts
   - Audit recipient lists

## Troubleshooting

### Emails Not Sending
1. Check RESEND_API_KEY is configured
2. Verify email domain is verified in Resend
3. Check alert_history table for errors
4. Test Resend API directly

### Alerts Not Triggering
1. Verify health-check function is running
2. Check GitHub Actions workflow status
3. Review alert configurations (enabled=true)
4. Check severity level settings

### Daily Summaries Not Arriving
1. Verify cron job is configured
2. Check summary_time in configurations
3. Ensure daily_summary is enabled
4. Review edge function logs

## Support

For issues or questions:
1. Check alert_history table for delivery status
2. Review edge function logs in Supabase dashboard
3. Test functions manually via dashboard
4. Contact support with alert_id for specific issues
