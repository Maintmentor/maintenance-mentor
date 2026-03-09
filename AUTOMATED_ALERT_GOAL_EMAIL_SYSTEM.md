# Automated Alert Goal Email Notification System

## Overview
The system automatically sends email notifications to admins when alert performance goals are missed for 3 consecutive periods. Emails include detailed metrics, historical trends, and actionable recommendations.

## Features

### 1. Automatic Email Triggers
- Monitors alert goal performance in real-time
- Detects 3 consecutive goal misses
- Automatically sends comprehensive email notifications
- Includes detailed performance metrics and trends

### 2. Email Content
Each notification email includes:
- **Goal Details**: Type, target value, current performance
- **Performance Metrics**: Current value vs target, miss percentage
- **Historical Trends**: Recent performance history with trend analysis
- **Actionable Recommendations**: Specific steps to improve performance
- **Trend Indicators**: Improving, declining, or stable trends

### 3. Automated Delivery
- GitHub Actions workflow runs every 6 hours
- Checks for unsent notifications
- Sends emails to all admin users
- Marks notifications as sent to prevent duplicates

## Email Templates

### Response Time Goals
**Recommendations include:**
- Review alert routing configuration
- Implement automated acknowledgment for low-priority alerts
- Set up escalation policies
- Analyze peak alert times and adjust coverage

### False Positive Rate Goals
**Recommendations include:**
- Review and refine alert thresholds
- Implement ML-based anomaly detection
- Add context to alerts for better identification
- Create feedback loops for marking false positives

### Uptime Percentage Goals
**Recommendations include:**
- Investigate recent outages
- Set up redundancy and failover mechanisms
- Implement health checks and auto-recovery
- Review infrastructure capacity

## Setup Instructions

### 1. Email Template (Already Created)
The email template is automatically created in the database with:
- Template name: `alert_goal_performance`
- Professional HTML formatting
- Plain text fallback
- Dynamic content rendering

### 2. GitHub Actions Workflow
Located at: `.github/workflows/alert-goal-notifications.yml`

**Schedule:** Runs every 6 hours
**Manual Trigger:** Available via GitHub Actions UI

### 3. Required Secrets
Ensure these are set in GitHub repository secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## How It Works

### Flow Diagram
```
1. Alert goal is tracked
   ↓
2. Goal is missed
   ↓
3. System checks for 3 consecutive misses
   ↓
4. Notification record created
   ↓
5. alertGoalService.sendGoalPerformanceEmail() called
   ↓
6. Email sent to all admin users
   ↓
7. Notification marked as sent
```

### Code Integration

**When tracking goal performance:**
```typescript
import { alertGoalService } from '@/services/alertGoalService';

// Track performance
await alertGoalService.trackGoalPerformance(
  'response_time',
  targetValue,
  actualValue,
  periodStart,
  periodEnd
);

// This automatically:
// 1. Records the measurement
// 2. Checks for consecutive misses
// 3. Creates notification if needed
// 4. Sends email to admins
```

**Manual email sending:**
```typescript
import { emailNotificationService } from '@/services/emailNotificationService';

await emailNotificationService.sendAlertGoalPerformanceEmail(
  notificationId,
  ['admin@example.com']
);
```

## Email Data Structure

```typescript
interface AlertGoalPerformanceData {
  goalType: string;                    // 'response_time', 'false_positive_rate', etc.
  goalTypeLabel: string;               // Human-readable label
  targetValue: number;                 // Goal target
  currentValue: number;                // Current performance
  consecutiveMisses: number;           // Number of consecutive misses
  historicalData: Array<{              // Recent performance history
    date: string;
    target: number;
    actual: number;
    met: boolean;
  }>;
  recommendations: string[];           // Actionable recommendations
  trend: 'improving' | 'declining' | 'stable';
  missPercentage: number;              // Percentage of recent misses
}
```

## Monitoring

### Check Sent Notifications
```sql
SELECT * FROM alert_goal_notifications
WHERE notification_sent = true
ORDER BY notification_sent_at DESC;
```

### Check Pending Notifications
```sql
SELECT * FROM alert_goal_notifications
WHERE notification_sent = false
ORDER BY created_at DESC;
```

### View Email Delivery Status
```sql
SELECT * FROM email_notifications
WHERE template_type = 'alert_goal_performance'
ORDER BY created_at DESC;
```

## Customization

### Modify Email Template
Update the template in the database:
```sql
UPDATE email_templates
SET html_template = 'your custom HTML',
    text_template = 'your custom text'
WHERE template_name = 'alert_goal_performance';
```

### Change Notification Frequency
Edit `.github/workflows/alert-goal-notifications.yml`:
```yaml
schedule:
  - cron: '0 */3 * * *'  # Every 3 hours
```

### Customize Recommendations
Edit `src/services/emailNotificationService.ts`:
```typescript
private generateRecommendations(goalType, targetValue, currentValue, trend) {
  // Add your custom recommendations
}
```

## Troubleshooting

### Emails Not Sending
1. Check GitHub Actions workflow status
2. Verify Supabase secrets are set correctly
3. Check email_notifications table for errors
4. Verify SendGrid API key is valid

### Duplicate Emails
- System prevents duplicates by marking notifications as sent
- Check notification_sent field in alert_goal_notifications

### Missing Recommendations
- Ensure emailNotificationService.generateRecommendations() is working
- Check that goal_type matches expected values

## Best Practices

1. **Monitor Email Delivery**: Regularly check email_notifications table
2. **Review Recommendations**: Update recommendations based on team feedback
3. **Adjust Thresholds**: Fine-tune consecutive miss threshold if needed
4. **Test Manually**: Use workflow_dispatch to test email sending
5. **Keep Admin List Updated**: Ensure admin role is assigned correctly

## API Reference

### alertGoalService Methods
- `trackGoalPerformance()` - Records performance and checks for misses
- `checkConsecutiveMisses()` - Checks for 3 consecutive misses
- `sendGoalPerformanceEmail()` - Sends email to admins
- `markNotificationSent()` - Marks notification as delivered

### emailNotificationService Methods
- `sendAlertGoalPerformanceEmail()` - Sends formatted email
- `calculateTrend()` - Analyzes performance trend
- `generateRecommendations()` - Creates actionable recommendations
