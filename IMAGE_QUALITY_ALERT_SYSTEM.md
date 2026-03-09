# Image Quality Alert System

## Overview
Automated alert system that monitors image quality metrics and sends email notifications to admins when quality thresholds are exceeded.

## Features

### 1. Automated Alert Triggers
- **Low Accuracy Alert**: Triggers when overall accuracy rate drops below 70% (configurable)
- **Part Negative Feedback Alert**: Triggers when a specific part receives more than 5 negative feedbacks in 24 hours (configurable)
- **Low AI Verification Scores**: Triggers when AI verification scores are consistently below 60% (configurable)

### 2. Email Notifications
- Sends email alerts to configured admin recipients
- Uses Resend API for reliable email delivery
- Includes alert details and metadata in email body
- Severity levels: Warning and Critical

### 3. Alert Settings Page
Located in Admin Dashboard → Image Quality Analytics → Settings tab

**Configurable Parameters:**
- Enable/disable each alert type
- Set custom threshold values
- Configure email recipients for each alert type
- Set timeframes and sample sizes

### 4. Alert History
All triggered alerts are stored in the database with:
- Alert type and severity
- Timestamp
- Detailed message and metadata
- Acknowledgment status

### 5. Recent Alerts Widget
Displays in Admin Dashboard → Image Quality Analytics → Alerts tab

**Features:**
- Shows last 5 alerts
- Manual acknowledgment capability
- "Check Now" button to trigger immediate alert check
- Visual severity indicators

## Database Tables

### `image_quality_alerts`
Stores alert history and acknowledgment status.

**Columns:**
- `id`: UUID primary key
- `alert_type`: Type of alert (low_accuracy, part_negative_feedback, low_verification_scores)
- `severity`: Warning or Critical
- `title`: Alert title
- `message`: Detailed alert message
- `metadata`: JSON with additional details
- `triggered_at`: When alert was triggered
- `acknowledged`: Boolean acknowledgment status
- `acknowledged_by`: User who acknowledged
- `acknowledged_at`: Acknowledgment timestamp

### `image_quality_alert_settings`
Stores alert configuration and thresholds.

**Columns:**
- `id`: UUID primary key
- `setting_key`: Unique setting identifier
- `setting_value`: JSON configuration object
- `updated_by`: User who last updated
- `updated_at`: Last update timestamp

## Edge Function

### `image-quality-alert-checker`
Checks all alert conditions and sends notifications.

**Endpoint:** `https://[project].supabase.co/functions/v1/image-quality-alert-checker`

**Checks:**
1. Overall accuracy rate from feedback data
2. Part-specific negative feedback counts in timeframe
3. Recent AI verification score trends

**Actions:**
- Inserts alert records into database
- Sends email notifications to configured recipients
- Returns summary of triggered alerts

## Usage

### Manual Alert Check
```typescript
import { imageQualityAlertService } from '@/services/imageQualityAlertService';

const result = await imageQualityAlertService.triggerAlertCheck();
console.log(`${result.alerts_triggered} alerts triggered`);
```

### Configure Alert Settings
1. Navigate to Admin Dashboard
2. Go to Image Quality Analytics → Settings tab
3. Enable/disable alerts
4. Set threshold values
5. Add email recipients
6. Save settings

### View Recent Alerts
1. Navigate to Admin Dashboard
2. Go to Image Quality Analytics → Alerts tab
3. View recent alerts
4. Acknowledge alerts as needed
5. Click "Check Now" to trigger immediate check

### Acknowledge Alert
```typescript
import { imageQualityAlertService } from '@/services/imageQualityAlertService';

await imageQualityAlertService.acknowledgeAlert(alertId, userId);
```

## Automation Setup

### Scheduled Checks (Recommended)
Set up a cron job or scheduled task to call the edge function periodically:

**Example using GitHub Actions:**
```yaml
name: Image Quality Alert Check
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Alert Check
        run: |
          curl -X POST https://[project].supabase.co/functions/v1/image-quality-alert-checker \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

## Alert Types Explained

### 1. Low Accuracy Alert
**Trigger:** Overall accuracy rate < threshold
**Default Threshold:** 70%
**Severity:** Critical
**Calculation:** (Positive Feedback / Total Feedback) * 100

### 2. Part Negative Feedback Alert
**Trigger:** Part receives >= threshold negative feedbacks in timeframe
**Default Threshold:** 5 negative feedbacks in 24 hours
**Severity:** Warning
**Use Case:** Identifies specific parts with consistently poor image quality

### 3. Low Verification Scores Alert
**Trigger:** > 50% of recent images have AI scores below threshold
**Default Threshold:** 60% AI score, 10 sample size
**Severity:** Warning
**Use Case:** Detects systematic issues with AI verification accuracy

## Email Template
Alerts are sent with the following format:

**Subject:** `[SEVERITY] Alert Title`

**Body:**
```
Alert Title
Alert Message

Details:
{
  "metadata": "values"
}

Alert ID: [uuid]
```

## Best Practices

1. **Set Realistic Thresholds**: Start with default values and adjust based on your data
2. **Monitor Alert Frequency**: Too many alerts indicate thresholds need adjustment
3. **Acknowledge Alerts**: Mark alerts as acknowledged after reviewing
4. **Review Negative Feedback**: Use manual review section to investigate problematic images
5. **Update Email Recipients**: Keep admin contact list current
6. **Regular Checks**: Run alert checks at least every 6 hours

## Troubleshooting

### No Alerts Triggered
- Check if alert types are enabled in settings
- Verify thresholds are appropriate for your data volume
- Ensure sufficient feedback data exists

### Emails Not Received
- Verify RESEND_API_KEY is configured in Supabase secrets
- Check email recipients are correctly formatted
- Review Resend dashboard for delivery status

### Alert Check Fails
- Check edge function logs in Supabase dashboard
- Verify database tables exist and have correct permissions
- Ensure RLS policies allow authenticated access

## Future Enhancements

- Slack/Discord webhook integration
- Custom alert rules builder
- Alert escalation policies
- Alert history charts and trends
- Batch alert digests
- SMS notifications for critical alerts
