# Automated Image Quality Alert System Setup

## Overview
The automated alert system runs every 6 hours via GitHub Actions to monitor image quality metrics and send email notifications when thresholds are breached.

## Components

### 1. GitHub Actions Workflow
**File:** `.github/workflows/image-quality-alerts.yml`

**Schedule:** Runs every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)

**Features:**
- Automatic retry logic (3 attempts with exponential backoff)
- Execution logging to database
- Failure notifications via email
- Manual trigger capability

### 2. Database Table
**Table:** `alert_execution_logs`

**Columns:**
- `id`: UUID primary key
- `execution_time`: Timestamp of execution
- `status`: success/failure/partial
- `alerts_triggered`: Number of alerts sent
- `errors`: Error messages if any
- `execution_duration_ms`: Runtime in milliseconds
- `retry_count`: Number of retry attempts
- `metadata`: Additional context (workflow info)

### 3. UI Components
- **AlertExecutionLogs**: Displays recent workflow runs
- **RecentAlertsWidget**: Shows triggered alerts
- **ImageQualityAlertSettings**: Configure thresholds

## Setup Instructions

### 1. GitHub Secrets Required
Add these secrets to your GitHub repository:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database writes

### 2. Enable GitHub Actions
1. Go to repository Settings → Actions → General
2. Enable "Allow all actions and reusable workflows"
3. Save changes

### 3. Manual Testing
Trigger the workflow manually:
1. Go to Actions tab in GitHub
2. Select "Image Quality Alert Checker"
3. Click "Run workflow"

## Monitoring

### View Execution Logs
Navigate to: Admin Dashboard → Images → Alerts Tab → Execution Logs

### Check Workflow Status
GitHub → Actions → Image Quality Alert Checker

## Alert Conditions
The system monitors three conditions:

1. **Low Accuracy Rate** (< 70%)
2. **High Negative Feedback** (> 5 for a part in 24h)
3. **Low AI Verification Scores** (< 60% consistently)

## Troubleshooting

### Workflow Fails
- Check GitHub Actions logs for detailed error messages
- Verify Supabase secrets are correctly configured
- Ensure edge function is deployed and accessible

### No Alerts Triggered
- Verify alert settings are enabled in UI
- Check threshold values are appropriate
- Confirm email recipients are configured

### Database Connection Issues
- Verify SUPABASE_SERVICE_ROLE_KEY has write permissions
- Check RLS policies on alert_execution_logs table

## Customization

### Change Schedule
Edit `.github/workflows/image-quality-alerts.yml`:
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Change this line
```

### Adjust Retry Logic
Modify MAX_RETRIES and WAIT_TIME in workflow file

### Add Custom Notifications
Extend the "Send Failure Notification" step with additional channels
