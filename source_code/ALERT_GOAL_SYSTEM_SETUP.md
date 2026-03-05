# Alert Performance Goal System - Setup Guide

## Overview
The Alert Performance Goal System allows administrators to set custom performance targets for the alert system and track whether these goals are being met over time. Visual indicators show goal status on the analytics dashboard, and notifications are sent when goals are consistently missed.

## Features

### 1. Goal Configuration
Admins can set three types of performance goals:
- **Response Time Goal**: Target time (in seconds) to acknowledge alerts
- **False Positive Rate Goal**: Maximum acceptable percentage of false alerts
- **Uptime Goal**: Minimum system availability percentage

### 2. Visual Goal Indicators
The Alert Analytics Dashboard displays badges on metric cards showing:
- ✅ **Meeting Goal**: Green badge with trending up icon
- ❌ **Below Goal**: Red badge with trending down icon

### 3. Goal History Tracking
All goal performance is tracked in the database with:
- Target value vs actual value
- Whether goal was met
- Time period for the measurement
- Historical trends over 30 days

### 4. Automated Notifications
When a goal is missed 3 consecutive times:
- A notification record is created
- Admins are alerted to investigate
- Notification delivery is tracked

## Database Tables

### alert_performance_goals
Stores active performance goals:
```sql
- id: UUID (primary key)
- goal_type: TEXT (response_time, false_positive_rate, uptime_percentage)
- target_value: DECIMAL (the target to achieve)
- created_by: UUID (admin who set the goal)
- created_at: TIMESTAMPTZ
- active: BOOLEAN (only one active goal per type)
- notes: TEXT (optional context)
```

### alert_goal_history
Tracks goal performance over time:
```sql
- id: UUID (primary key)
- goal_id: UUID (reference to goal)
- goal_type: TEXT
- target_value: DECIMAL
- actual_value: DECIMAL
- met_goal: BOOLEAN
- period_start: TIMESTAMPTZ
- period_end: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

### alert_goal_notifications
Manages notifications for missed goals:
```sql
- id: UUID (primary key)
- goal_type: TEXT
- consecutive_misses: INTEGER
- notification_sent: BOOLEAN
- notification_sent_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

## Usage Guide

### Setting Goals

1. Navigate to **Admin Dashboard** → **Image Quality Analytics**
2. Click on the **Settings** tab
3. Configure your performance goals:
   - **Response Time**: Enter target in seconds (e.g., 300 for 5 minutes)
   - **False Positive Rate**: Enter maximum acceptable % (e.g., 5 for 5%)
   - **Uptime**: Enter minimum % (e.g., 99.5 for 99.5%)
4. Add optional notes explaining the goals
5. Click **Save Goals**

### Viewing Goal Status

1. Go to **Alert Analytics Dashboard**
2. Check the metric cards at the top:
   - Each card shows current performance
   - Goal badges indicate if targets are being met
   - Green = Meeting Goal, Red = Below Goal

### Monitoring Goal History

1. Navigate to **Settings** tab in Image Quality Dashboard
2. View **Goal Performance History** widget
3. See last 10 goal measurements with:
   - Goal type and time period
   - Target vs actual values
   - Met/Missed status

### Tracking Consecutive Misses

The system automatically:
1. Evaluates each goal after measurement
2. Counts consecutive misses
3. Creates notification after 3 consecutive misses
4. Tracks notification delivery status

## API Service Methods

### alertGoalService

```typescript
// Get all active goals
const goals = await alertGoalService.getActiveGoals();

// Set a new goal (deactivates previous goal of same type)
await alertGoalService.setGoal('response_time', 300, 'Optional notes');

// Get goal history for last N days
const history = await alertGoalService.getGoalHistory(30);

// Track goal performance
await alertGoalService.trackGoalPerformance(
  'response_time',
  300,        // target value
  250,        // actual value
  startDate,
  endDate
);

// Check if goal is met
const isMet = alertGoalService.evaluateGoal('response_time', 300, 250);

// Get unsent notifications
const notifications = await alertGoalService.getUnsentNotifications();

// Mark notification as sent
await alertGoalService.markNotificationSent(notificationId);
```

## Goal Evaluation Logic

### Response Time
- **Met**: actual_value ≤ target_value
- Lower is better

### False Positive Rate
- **Met**: actual_value ≤ target_value
- Lower is better

### Uptime Percentage
- **Met**: actual_value ≥ target_value
- Higher is better

## Best Practices

### Setting Realistic Goals

1. **Response Time**
   - Start with current average + 20%
   - Gradually tighten as team improves
   - Consider time zones and staffing

2. **False Positive Rate**
   - Industry standard: 5-10%
   - Start conservative, improve over time
   - Balance with alert sensitivity

3. **Uptime**
   - Start with 95%
   - Aim for 99% as system matures
   - Consider maintenance windows

### Monitoring and Adjustment

1. Review goal history weekly
2. Adjust targets quarterly based on trends
3. Document reasons for goal changes
4. Communicate changes to team

### Responding to Missed Goals

When goals are consistently missed:
1. Review alert execution logs
2. Identify bottlenecks or issues
3. Adjust processes or resources
4. Consider if goal is too aggressive

## Troubleshooting

### Goals Not Showing on Dashboard
- Verify goals are set to `active = true`
- Check that goal types match exactly
- Refresh dashboard after setting goals

### Goal Badges Not Appearing
- Ensure metrics are loading successfully
- Check that actual values are being calculated
- Verify goal comparison logic

### Notifications Not Triggering
- Confirm 3 consecutive misses occurred
- Check `alert_goal_notifications` table
- Verify notification service is running

### History Not Recording
- Ensure `trackGoalPerformance` is being called
- Check database permissions
- Verify date ranges are valid

## Future Enhancements

Potential additions to the goal system:
1. Email notifications for missed goals
2. Slack/Teams integration for alerts
3. Goal achievement celebrations
4. Trend analysis and predictions
5. Custom goal types
6. Team-specific goals
7. Goal templates for different industries

## Support

For issues or questions:
1. Check database logs for errors
2. Review browser console for client errors
3. Verify Supabase RLS policies
4. Contact system administrator
