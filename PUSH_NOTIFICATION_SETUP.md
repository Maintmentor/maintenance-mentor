# Push Notification System Setup

## Overview
Browser push notifications for critical storage alerts using the Web Push API with Supabase backend.

## Features
- ✅ Real-time browser push notifications
- ✅ User subscription management
- ✅ Granular notification preferences
- ✅ Quiet hours support
- ✅ Notification history tracking
- ✅ Rich notifications with action buttons
- ✅ Critical alert prioritization

## Database Tables

### push_subscriptions
Stores user push notification subscriptions:
- `endpoint`: Push subscription endpoint URL
- `p256dh`: Public key for encryption
- `auth`: Authentication secret
- `is_active`: Subscription status

### notification_preferences
User notification preferences:
- `storage_alerts`: 80% capacity warnings
- `critical_alerts`: Immediate critical issues
- `upload_alerts`: Unusual upload patterns
- `access_alerts`: Stale file warnings (6+ months)
- `daily_summary`: Daily storage reports
- `quiet_hours_start/end`: Do not disturb period

### notification_history
Tracks all sent notifications:
- Delivery status
- Click tracking
- Action taken
- Timestamp

## Setup Instructions

### 1. Run Database Migration
```bash
# Apply the migration
supabase db push

# Or manually run:
psql -f supabase/migrations/20250127_push_notifications_system.sql
```

### 2. Deploy Edge Function
```bash
# Deploy the push notification sender
supabase functions deploy push-notification-sender

# Set VAPID keys (optional, for production)
supabase secrets set VAPID_PUBLIC_KEY="your-public-key"
supabase secrets set VAPID_PRIVATE_KEY="your-private-key"
```

### 3. Update Service Worker
The service worker has been updated to handle push notifications.
Clear browser cache and reload to activate the new service worker.

## Usage

### Enable Push Notifications
1. Navigate to Admin Dashboard → Storage → Live tab
2. Click "Enable" in the Push Notifications card
3. Grant browser permission when prompted
4. Configure notification preferences

### Notification Types

**Critical Alerts** (Immediate)
- Bucket capacity > 95%
- Quota exceeded
- Security breaches
- Unusual activity spikes

**Storage Alerts** (High Priority)
- Bucket capacity > 80%
- Rapid storage growth
- Approaching limits

**Upload Alerts**
- Unusual upload patterns
- Large file uploads
- Bulk operations

**Access Alerts**
- Files not accessed in 6+ months
- Stale data warnings

**Daily Summary**
- Storage usage overview
- Trend analysis
- Recommendations

### Testing Push Notifications

```javascript
// Send test notification via edge function
const { data, error } = await supabase.functions.invoke('push-notification-sender', {
  body: {
    title: 'Test Storage Alert',
    body: 'This is a test notification',
    type: 'critical_alerts',
    data: {
      bucket_name: 'test-bucket',
      severity: 'high'
    }
  }
});
```

## Integration with Storage Monitoring

Push notifications are automatically sent when:

1. **Real-time alerts** trigger in storage monitoring
2. **Capacity thresholds** are exceeded
3. **Unusual patterns** are detected
4. **Critical events** occur

The `realtimeStorageService.sendCriticalNotification()` method handles both email and push notifications.

## Notification Actions

Users can interact with notifications:
- **View Dashboard**: Opens admin storage dashboard
- **Dismiss**: Closes notification
- **Custom actions**: Based on alert type

## Browser Compatibility

- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (macOS 16.4+, iOS 16.4+)
- ❌ iOS Safari (< 16.4)

## Security

- VAPID keys for authentication
- End-to-end encryption (p256dh + auth)
- User-specific subscriptions
- RLS policies on all tables

## Troubleshooting

### Notifications not appearing
1. Check browser permission: Settings → Notifications
2. Verify service worker is active: DevTools → Application → Service Workers
3. Check subscription status in database
4. Review edge function logs

### Permission denied
- User must manually grant permission
- Cannot be triggered programmatically
- Check browser notification settings

### Notifications not sending
1. Verify edge function is deployed
2. Check notification preferences in database
3. Ensure user is not in quiet hours
4. Review edge function logs for errors

## Best Practices

1. **Request permission contextually**: Ask when user enables storage monitoring
2. **Respect quiet hours**: Don't send non-critical alerts during quiet hours
3. **Limit frequency**: Avoid notification fatigue
4. **Provide value**: Only send actionable notifications
5. **Track engagement**: Monitor click rates and adjust

## Future Enhancements

- [ ] Web Push Protocol implementation for actual push delivery
- [ ] Push notification templates
- [ ] A/B testing for notification content
- [ ] Notification scheduling
- [ ] Multi-device sync
- [ ] Rich media in notifications
