# Trial Analytics System Documentation

## Overview
The Trial Analytics System tracks trial conversion rates, revenue from conversions, and provides comprehensive insights into trial performance with CSV export functionality.

## Features
- **Real-time Metrics**: Track total trials, active trials, expired trials, and conversions
- **Conversion Rate Tracking**: Monitor conversion rates and average time to conversion
- **Revenue Analytics**: Track revenue by subscription plan from trial conversions
- **Trend Analysis**: Visualize conversion trends over time with interactive charts
- **CSV Export**: Export all analytics data to CSV for further analysis
- **Automatic Tracking**: Stripe webhook integration automatically records conversions

## Database Schema

### trial_analytics Table
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- trial_start_date: TIMESTAMPTZ
- trial_end_date: TIMESTAMPTZ
- converted_to_paid: BOOLEAN
- conversion_date: TIMESTAMPTZ
- subscription_plan: TEXT
- revenue_amount: DECIMAL(10,2)
- days_to_conversion: INTEGER
- cancellation_date: TIMESTAMPTZ
- cancellation_reason: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Key Metrics Tracked

1. **Total Trials**: All users who started a trial
2. **Active Trials**: Users currently in trial period
3. **Expired Trials**: Trials that ended without conversion
4. **Converted Trials**: Users who upgraded to paid plans
5. **Conversion Rate**: Percentage of trials that convert to paid
6. **Average Days to Conversion**: How long users take to upgrade
7. **Total Revenue**: Revenue generated from trial conversions
8. **Cancelled Trials**: Users who explicitly cancelled

## Accessing Analytics

### Admin Dashboard
1. Navigate to Admin Dashboard
2. Click on "Trials" tab
3. View comprehensive analytics with charts and metrics

### Key Components
- **TrialMetricsCards**: Display key statistics at a glance
- **TrialConversionChart**: Visualize trends over time
- **Revenue by Plan Chart**: See which plans generate most revenue

## Automatic Tracking

### Stripe Webhook Integration
The system automatically tracks conversions when:
- User subscribes to a paid plan (subscription.created/updated)
- Subscription is cancelled (subscription.deleted)
- Payments succeed or fail

### Data Recorded
- Conversion date and time
- Subscription plan selected
- Revenue amount
- Days from trial start to conversion
- Cancellation information if applicable

## CSV Export

### Available Exports
1. **Trial Metrics**: Overall statistics and KPIs
2. **Conversion Trends**: Daily trial starts and conversions
3. **Revenue by Plan**: Revenue breakdown by subscription plan

### How to Export
1. Click "Export All" button in dashboard header
2. Or use individual export buttons on each section
3. Files are downloaded as CSV format

## Analytics Queries

### Get Conversion Rate for Date Range
```typescript
const metrics = await trialAnalyticsService.getTrialMetrics(startDate, endDate);
console.log(`Conversion Rate: ${metrics.conversionRate}%`);
```

### Get 30-Day Trends
```typescript
const trends = await trialAnalyticsService.getConversionTrends(30);
```

### Get Revenue by Plan
```typescript
const revenue = await trialAnalyticsService.getRevenueByPlan();
```

## Best Practices

1. **Monitor Daily**: Check analytics daily to spot trends early
2. **Track Conversion Times**: Identify optimal trial length
3. **Analyze Plan Preferences**: See which plans convert best
4. **Export Regularly**: Keep historical data for long-term analysis
5. **Compare Periods**: Use date filters to compare performance

## Troubleshooting

### No Data Showing
- Ensure trial_analytics table exists and has RLS policies
- Check that Stripe webhook is properly configured
- Verify users have trial_start_date set in profiles

### Incorrect Metrics
- Refresh the dashboard to get latest data
- Check Stripe webhook logs for processing errors
- Verify timezone settings match your requirements

### Export Issues
- Ensure browser allows downloads
- Check that data exists for the selected period
- Try exporting smaller date ranges if file is large

## Future Enhancements
- Email reports with weekly/monthly summaries
- A/B testing for different trial lengths
- Cohort analysis by signup source
- Predictive analytics for conversion likelihood
- Integration with marketing automation tools
