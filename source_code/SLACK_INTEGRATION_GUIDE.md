# Slack Integration Guide for API Key Validation System

## Overview

The API Key Validation System now includes comprehensive Slack integration for real-time alerts when API keys become invalid, expire, or encounter issues.

## Features

- **Real-time Slack Alerts**: Automatically send alerts to Slack channels when API keys have issues
- **Rich Message Formatting**: Color-coded severity levels (critical, warning, info)
- **Multiple Webhook Support**: Configure multiple Slack channels for different alert types
- **Alert History Tracking**: View all Slack notifications sent by the system
- **Test Webhook**: Send test alerts to verify Slack configuration
- **Automated Monitoring**: GitHub Actions workflow for periodic checks

## Setup Instructions

### 1. Create Slack Webhook

1. Go to your Slack workspace settings
2. Navigate to **Apps** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Select the channel where you want to receive alerts
5. Copy the webhook URL (e.g., `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`)

### 2. Configure Webhook in Admin Dashboard

1. Navigate to **Admin Dashboard** → **Slack** tab
2. Click **Add Slack Webhook**
3. Enter the webhook URL
4. Enter the channel name (e.g., `#api-alerts`)
5. Select alert types to receive:
   - **Critical**: Invalid keys, consecutive failures
   - **Warning**: Keys expiring within 7 days
   - **Info**: General validation updates
6. Click **Add Webhook**

### 3. Test Your Configuration

1. In the Slack tab, find your configured webhook
2. Click the **Send** (test) button
3. Check your Slack channel for the test message
4. Verify the message appears correctly

## Alert Types and Colors

### Critical Alerts (Red)
- API key is invalid
- 3+ consecutive validation failures
- Key has been revoked
- Authentication errors

### Warning Alerts (Orange)
- Key expires within 7 days
- Rate limiting detected
- Intermittent failures

### Info Alerts (Blue)
- Validation completed successfully
- Key health score updates
- System status notifications

## Slack Message Format

Each Slack alert includes:

- **Alert Type**: Critical, Warning, or Info
- **Health Score**: 0-100 score based on validation history
- **Status**: Detailed error message or status
- **Last Validated**: Timestamp of last validation check
- **Expires At**: Expiration date (if applicable)

## Manual Alert Sending

### From Dashboard

1. Go to **Admin Dashboard** → **API Keys** tab
2. Click **Send Slack Alerts** button
3. Alerts will be sent for all active issues

### Programmatically

```typescript
import { supabase } from '@/lib/supabase';

await supabase.functions.invoke('slack-alert-sender', {
  body: {
    keyName: 'OPENAI_API_KEY',
    alertType: 'critical',
    healthScore: 45,
    errorMessage: 'Invalid API key',
    lastValidated: new Date().toISOString()
  }
});
```

## Automated Monitoring

The system includes a GitHub Actions workflow that:

1. Validates all API keys every 6 hours
2. Automatically sends Slack alerts for any issues
3. Can be manually triggered from GitHub Actions tab

### Workflow File

`.github/workflows/slack-api-key-alerts.yml`

## Managing Webhooks

### Enable/Disable Webhook

Use the toggle switch next to each webhook to enable or disable it without deleting the configuration.

### Delete Webhook

Click the trash icon to permanently delete a webhook configuration.

### Update Alert Types

You cannot update alert types after creation. Delete and recreate the webhook with new settings.

## Notification History

View all Slack notifications in the **Slack Notification History** section:

- Sent/Failed status
- Timestamp
- Key name
- Alert type
- Error messages (if failed)

## Troubleshooting

### Alerts Not Appearing in Slack

1. Verify webhook URL is correct
2. Check that webhook is enabled
3. Ensure channel exists and webhook has permissions
4. Review notification history for error messages

### Test Alert Not Sending

1. Check browser console for errors
2. Verify Supabase edge function is deployed
3. Test webhook URL directly with curl:

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

### Wrong Channel Receiving Alerts

1. Verify channel name matches Slack channel
2. Check webhook was created for correct channel
3. Recreate webhook if needed

## Best Practices

1. **Dedicated Channel**: Create a dedicated `#api-alerts` channel for key monitoring
2. **Multiple Webhooks**: Configure separate webhooks for critical vs. warning alerts
3. **Alert Fatigue**: Only enable alert types you need to monitor
4. **Regular Testing**: Test webhooks monthly to ensure they're working
5. **Rotation**: Update webhook URLs when rotating Slack app credentials

## Database Tables

### slack_webhook_config

Stores webhook configurations:
- `webhook_url`: Slack incoming webhook URL
- `channel_name`: Target Slack channel
- `enabled`: Whether webhook is active
- `alert_types`: Array of alert types to send

### slack_notifications

Tracks notification history:
- `alert_type`: Type of alert sent
- `key_name`: API key that triggered alert
- `status`: sent or failed
- `error_message`: Error details if failed

## Security Considerations

1. **Webhook URLs**: Treat webhook URLs as secrets
2. **RLS Policies**: Only admins can view/manage webhooks
3. **Rate Limiting**: Slack has rate limits on webhook usage
4. **Message Content**: Avoid including full API keys in messages

## Support

For issues or questions:
1. Check notification history for error details
2. Review Supabase edge function logs
3. Test webhook URL directly
4. Verify Slack app permissions
