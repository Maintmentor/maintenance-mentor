# Cache Email Notification System

## Overview
Automated email notification system that alerts administrators when critical cache performance issues are detected.

## Features

### 1. **Automated Alert Detection**
- **Low Hit Rate**: Alert when cache hit rate drops below 40%
- **High Response Time**: Alert when response time exceeds 2000ms
- **Storage Limit**: Alert when cache storage approaches capacity
- **API Errors**: Alert when API error rate is too high

### 2. **Email Notifications**
- Beautiful HTML email templates with severity indicators
- Detailed metrics and recommended actions
- Sent via Resend API (configured with RESEND_API_KEY)
- Delivery tracking and error logging

### 3. **User Preferences**
- Customize which alert types to receive
- Filter by severity level (critical, warning)
- Enable/disable notifications per user
- Multiple admin recipients supported

### 4. **Notification History**
- Track all sent emails
- View delivery status
- Monitor failed deliveries
- Audit trail for compliance

## Setup Instructions

### 1. Database Migration
Run the migration to create required tables:
```bash
# Apply migration
supabase db push
```

### 2. Deploy Edge Function
```bash
# Deploy the email sender function
supabase functions deploy cache-alert-email-sender
```

### 3. Configure Email Preferences
1. Navigate to Admin Dashboard
2. Go to Cache Management section
3. Click "Email Notification Settings"
4. Enter your email address
5. Select alert types and severity levels
6. Save preferences

### 4. Test Email Notifications
```typescript
// Manually trigger an alert to test
import { cacheAlertService } from '@/services/cacheAlertService';

await cacheAlertService.checkAndCreateAlerts();
```

## Email Template Features

### Critical Alerts (🚨)
- Red header background
- Urgent severity indicator
- Immediate action required

### Warning Alerts (⚠️)
- Orange header background
- Warning severity indicator
- Monitoring recommended

### Email Content Includes:
- Alert type and severity
- Current metric value vs threshold
- Timestamp of detection
- Recommended action steps
- Link to admin dashboard
- Professional HTML formatting

## Alert Thresholds

| Alert Type | Threshold | Severity |
|------------|-----------|----------|
| Low Hit Rate | < 40% | Critical |
| Low Hit Rate | < 60% | Warning |
| High Response Time | > 2000ms | Critical |
| High Response Time | > 1000ms | Warning |
| Storage Limit | > 120% capacity | Critical |
| Storage Limit | > 100% capacity | Warning |
| API Errors | > 20/hour | Critical |
| API Errors | > 10/hour | Warning |

## Integration with Existing System

The email notification system integrates seamlessly with:
- **Cache Alert Service**: Automatically sends emails when alerts are created
- **Performance Monitoring**: Uses existing analytics data
- **Admin Dashboard**: UI for managing preferences
- **GitHub Actions**: Hourly automated checks

## Notification Flow

1. **Scheduled Check** (Hourly via GitHub Actions)
   - Analyze cache performance metrics
   - Compare against thresholds

2. **Alert Creation**
   - Create alert record in database
   - Determine severity level

3. **Recipient Selection**
   - Query user preferences
   - Filter by alert type and severity
   - Get list of enabled recipients

4. **Email Sending**
   - Call edge function with alert details
   - Generate HTML email template
   - Send via Resend API
   - Log delivery status

5. **Tracking**
   - Record email notification
   - Track delivery success/failure
   - Store for audit purposes

## Admin Components

### CacheEmailNotificationSettings
- Configure email preferences
- Enable/disable notifications
- Select alert types
- Choose severity levels

### CacheEmailNotificationHistory
- View sent emails
- Check delivery status
- Monitor failed deliveries
- Export notification logs

## API Integration

### Edge Function: cache-alert-email-sender
```typescript
// Request body
{
  alertType: 'low_hit_rate' | 'high_response_time' | 'storage_limit' | 'api_errors',
  severity: 'critical' | 'warning',
  message: string,
  threshold: number,
  currentValue: number,
  recipients: string[] // Email addresses
}

// Response
{
  success: boolean,
  results: [
    {
      email: string,
      success: boolean,
      result: object
    }
  ]
}
```

## Best Practices

1. **Configure Multiple Recipients**: Add multiple admin emails for redundancy
2. **Test Regularly**: Use manual trigger to verify email delivery
3. **Monitor Delivery Status**: Check notification history for failed emails
4. **Adjust Thresholds**: Customize alert thresholds based on your needs
5. **Review Preferences**: Ensure all admins have correct email preferences

## Troubleshooting

### Emails Not Sending
- Verify RESEND_API_KEY is configured in Supabase
- Check edge function deployment status
- Review notification history for error messages
- Ensure user preferences are enabled

### Wrong Recipients
- Check email_notification_preferences table
- Verify alert_types and severity_levels arrays
- Ensure enabled = true for recipients

### Missing Alerts
- Verify GitHub Action is running hourly
- Check cache_performance_alerts table
- Review cacheAlertService thresholds
- Monitor edge function logs

## Monitoring

Track email notification performance:
- **Delivery Rate**: % of successfully sent emails
- **Response Time**: Time from alert to email delivery
- **Failed Deliveries**: Count of failed email attempts
- **Alert Frequency**: Number of alerts per day

## Cost Optimization

- Resend offers 100 free emails/day
- Alerts only sent for critical/warning severity
- Hourly checks prevent alert fatigue
- Duplicate alerts suppressed within 1 hour

## Future Enhancements

- SMS notifications via Twilio
- Slack/Discord webhook integration
- Alert escalation policies
- Digest emails (daily summary)
- Custom email templates per user
- Alert acknowledgment system
