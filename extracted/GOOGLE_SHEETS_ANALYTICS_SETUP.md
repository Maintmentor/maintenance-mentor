# Google Sheets Analytics Dashboard Setup Guide

## Overview

The Google Sheets Analytics Dashboard provides comprehensive insights into how users are utilizing the Google Sheets integration for logging repair queries. This system tracks usage patterns, identifies trends, and monitors sheet health.

## Features Implemented

### 1. Analytics Service (`googleSheetsAnalyticsService.ts`)

The service provides the following analytics capabilities:

- **Total Queries Per User**: Track how many queries each user has logged
- **Query Trends**: Visualize query volume over time (30-day default)
- **Category Breakdown**: See which repair categories are most common
- **Sheet Health Metrics**: Monitor sheet status and identify issues
- **Average Response Time**: Track system performance
- **Export Functionality**: Generate comprehensive JSON reports

### 2. Visualization Components

#### Query Trends Chart (`QueryTrendsChart.tsx`)
- Line chart showing query volume over time
- Interactive tooltips with date formatting
- Responsive design for all screen sizes

#### Category Breakdown Chart (`CategoryBreakdownChart.tsx`)
- Bar chart displaying query distribution by category
- Color-coded bars for visual clarity
- Shows both count and percentage

### 3. Main Dashboard (`GoogleSheetsAnalyticsDashboard.tsx`)

Comprehensive dashboard featuring:

**Summary Cards:**
- Total Queries: Aggregate count across all users
- Active Users: Number of users with Google Sheets integration
- Average Response Time: System performance metric
- Sheet Health: Visual breakdown of healthy/warning/error sheets

**Data Tables:**
- Most Active Users: Top 10 users by query count
- Sheet Health Status: Detailed health monitoring for all sheets

**Interactive Features:**
- Real-time data loading
- Export analytics reports to JSON
- Refresh capability
- Error handling with toast notifications

## Database Schema

The analytics system queries the following tables:

```sql
-- user_google_sheets table
user_id (uuid, FK to profiles)
sheet_id (text)
created_at (timestamp)
updated_at (timestamp)

-- profiles table
id (uuid, PK)
email (text)
```

## Admin Dashboard Integration

The analytics dashboard is integrated into the admin panel:

1. Navigate to Admin Dashboard
2. Click on "Analytics" tab (next to "Sheets" tab)
3. View comprehensive analytics and export reports

## Usage Metrics Tracked

1. **User Engagement**
   - Total queries per user
   - Last query timestamp
   - Active vs. inactive users

2. **Temporal Patterns**
   - Daily query trends
   - Peak usage times
   - Growth patterns

3. **Content Analysis**
   - Category distribution
   - Most common repair types
   - Query complexity

4. **System Health**
   - Sheet update frequency
   - Row count monitoring
   - Error detection

## Health Status Indicators

Sheets are automatically classified into three health states:

- **Healthy** (Green): Updated within last 7 days
- **Warning** (Yellow): Updated 7-30 days ago
- **Error** (Red): Not updated in 30+ days

## Export Format

Analytics reports are exported in JSON format with the following structure:

```json
{
  "generated_at": "ISO timestamp",
  "summary": {
    "total_users": number,
    "total_queries": number,
    "average_queries_per_user": number
  },
  "users": [...],
  "trends": [...],
  "categories": [...],
  "health": [...]
}
```

## Future Enhancements

To enhance the analytics system with real data:

1. **Query Logging Table**: Create a dedicated table to track individual queries
   ```sql
   CREATE TABLE query_logs (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id uuid REFERENCES profiles(id),
     query_text text,
     category text,
     response_time float,
     created_at timestamp DEFAULT now()
   );
   ```

2. **Real-time Updates**: Implement Supabase realtime subscriptions for live data

3. **Advanced Analytics**:
   - User retention metrics
   - Query success rates
   - Response time optimization
   - Predictive analytics for usage patterns

4. **Custom Date Ranges**: Allow admins to select custom time periods

5. **Comparison Views**: Compare metrics across different time periods

## Troubleshooting

### No Data Showing
- Verify users have Google Sheets integration enabled
- Check database connection
- Ensure proper permissions for admin users

### Export Failing
- Check browser console for errors
- Verify sufficient data exists
- Ensure proper file download permissions

### Charts Not Rendering
- Verify recharts library is installed
- Check for JavaScript errors in console
- Ensure data format matches chart expectations

## API Endpoints Used

The analytics system uses the following Supabase queries:

- `user_google_sheets.select()`: Fetch sheet mappings
- `profiles.select()`: Get user information
- Edge function: `google-sheets-logger` (for future real-time logging)

## Performance Considerations

- Analytics data is fetched on-demand
- Large datasets may require pagination
- Consider implementing caching for frequently accessed metrics
- Export functionality handles large datasets efficiently

## Security

- Admin-only access enforced via ProtectedRoute
- User data privacy maintained
- No sensitive information in exports
- Proper error handling prevents data leaks
