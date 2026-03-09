# API Key Email Alert Integration

## Overview
The API key validation system has been integrated with the email notification service to automatically send alerts to admins when API keys are invalid, expiring, or have been revoked.

## Features

### 1. Automated Email Alerts
- **Invalid Keys**: Immediate alerts when keys fail validation
- **Expiring Keys**: Warning alerts for keys expiring within 7 days
- **Health Scores**: Detailed health metrics included in emails
- **Recommended Actions**: Step-by-step guidance for fixing issues

### 2. Email Template
Beautiful, responsive HTML email template includes:
- Visual severity indicators (🚨 for critical, ⚠️ for warnings)
- Key details: name, type, health score, error messages
- Expiration dates and countdown
- Direct link to admin dashboard
- Recommended action items
- Professional gradient header design

### 3. Manual & Automated Sending
- **Manual**: Click "Send Email Alerts" button in dashboard
- **Automated**: GitHub Actions workflow runs every 6 hours
- Only sends when there are active alerts
- Tracks all sent emails in database

## Setup Instructions

### 1. Deploy Edge Function
```bash
supabase functions deploy api-key-email-alerts
```

### 2. Run Migration
```bash
supabase db push
```
This creates the `email_templates` table and inserts the API key alert template.

### 3. Configure Admin Emails
Ensure admin users have their role set to 'admin' in the profiles table:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

### 4. Test Email Alerts
1. Go to Admin Dashboard → API Keys tab
2. Click "Validate All Keys"
3. If any keys are invalid, click "Send Email Alerts"
4. Check admin email inbox

## Email Content

### Subject Line
```
🚨 API Key Alert: [N] Invalid Keys Detected
```

### Email Sections

#### 1. Invalid Keys Section
- Lists all currently invalid keys
- Shows key name, type, and health score
- Displays specific error messages
- Last validation timestamp

#### 2. Expiring Keys Section
- Lists keys expiring within 7 days
- Shows exact expiration date
- Warning badge with days remaining

#### 3. Recommended Actions
- Verify and update invalid keys immediately
- Check service provider dashboards
- Review error logs
- Rotate expiring keys
- Test new keys in staging
- Monitor dashboard for real-time status

#### 4. Call-to-Action
Direct link to the admin dashboard for immediate action.

## Automated Workflow

### GitHub Actions Schedule
The workflow runs automatically every 6 hours:
- 12:00 AM
- 6:00 AM
- 12:00 PM
- 6:00 PM

### Workflow File
`.github/workflows/api-key-email-notifications.yml`

### Manual Trigger
You can also trigger the workflow manually from the GitHub Actions tab.

## Database Tables

### email_templates
Stores reusable email templates with variables:
- `template_name`: 'api_key_alert'
- `subject_template`: Subject with {{variables}}
- `html_template`: Full HTML email body
- `is_active`: Enable/disable template

### api_key_alerts
Logs all sent alerts:
- `key_name`: Which key triggered the alert
- `alert_type`: 'email', 'slack', etc.
- `severity`: 'critical', 'warning', 'info'
- `message`: Alert details
- `metadata`: Additional context

## Customization

### Update Email Template
1. Edit the template in the database:
```sql
UPDATE email_templates 
SET html_template = 'your new template'
WHERE template_name = 'api_key_alert';
```

2. Or modify `supabase/migrations/20250127_api_key_email_templates.sql`

### Change Email Frequency
Edit `.github/workflows/api-key-email-notifications.yml`:
```yaml
schedule:
  - cron: '0 */3 * * *'  # Every 3 hours
```

### Customize Sender
Edit `supabase/functions/api-key-email-alerts/index.ts`:
```typescript
from: { 
  email: 'alerts@yourdomain.com', 
  name: 'Your Company API Monitor' 
}
```

## Monitoring

### View Email History
Check the `api_key_alerts` table:
```sql
SELECT * FROM api_key_alerts 
WHERE alert_type = 'email' 
ORDER BY created_at DESC;
```

### View Sent Emails
Check SendGrid dashboard for delivery status, opens, and clicks.

## Troubleshooting

### Emails Not Sending
1. Verify SENDGRID_API_KEY is set correctly
2. Check admin users have role = 'admin'
3. Ensure there are active alerts
4. Check edge function logs

### Template Not Rendering
1. Verify template exists in database
2. Check variable names match ({{variable}})
3. Test template rendering manually

### Wrong Recipients
1. Verify admin role assignments
2. Check email addresses in profiles table
3. Update admin emails as needed

## Best Practices

1. **Test First**: Always test with a single admin email before enabling for all
2. **Monitor Frequency**: Adjust email frequency based on your needs
3. **Keep Templates Updated**: Regularly review and improve email content
4. **Track Metrics**: Monitor open rates and response times
5. **Set Up Filters**: Create email filters for critical alerts

## Integration with Other Services

### Slack Integration
Combine with Slack alerts for multi-channel notifications:
```typescript
// Send to both email and Slack
await Promise.all([
  sendEmailAlerts(invalidKeys),
  sendSlackAlerts(invalidKeys)
]);
```

### SMS Integration (Future)
Add Twilio integration for critical alerts:
```typescript
if (severity === 'critical') {
  await sendSMSAlert(adminPhone, message);
}
```

## Security Considerations

1. **API Keys**: Never include actual API keys in emails
2. **Access Control**: Only send to verified admin users
3. **Rate Limiting**: Prevent email spam with cooldown periods
4. **Audit Trail**: Log all email sends for compliance

## Support

For issues or questions:
1. Check edge function logs in Supabase dashboard
2. Review GitHub Actions workflow runs
3. Verify SendGrid API key status
4. Check database for alert records
