# 🚀 One-Click Repair Diagnostic Deployment Guide

## Quick Start

### Option 1: Run the Shell Script (Recommended)

```bash
# Make the script executable
chmod +x deploy-repair-diagnostic-one-click.sh

# Run the deployment
./deploy-repair-diagnostic-one-click.sh
```

The script will:
- ✅ Check if Supabase CLI is installed
- ✅ Verify you're logged in to Supabase
- ✅ Link to your project
- ✅ Check if repair-diagnostic is already deployed
- ✅ Verify OPENAI_API_KEY secret is set
- ✅ Deploy the function with automatic retry (up to 3 attempts)
- ✅ Test the deployed function
- ✅ Show success/failure status

### Option 2: Use the Admin Dashboard UI

1. Navigate to `/admin` in your app
2. Click the **"Deploy"** tab
3. Click **"Deploy Now"** in the One-Click Deployment card
4. Watch real-time deployment logs
5. See success/failure notifications

## Prerequisites

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Set OpenAI API Key

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

## Features

### Automatic Retry Logic
- Attempts deployment up to 3 times
- 5-second delay between retries
- Clear status messages for each attempt

### Rollback on Failure
- If all retries fail, the script exits with error code
- Previous version remains active (if any)
- No partial deployments

### Real-Time Logs
- Color-coded output (green = success, red = error, yellow = warning)
- Timestamp for each action
- Detailed error messages

### Function Testing
- Automatically tests deployed function
- Verifies function is responding
- Shows test results

## Troubleshooting

### Error: "Supabase CLI not found"

```bash
npm install -g supabase
```

### Error: "Not logged in to Supabase"

```bash
supabase login
```

### Error: "OPENAI_API_KEY not found"

```bash
# Set the secret
supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Verify it's set
supabase secrets list
```

### Error: "Deployment failed after 3 attempts"

1. Check function code:
```bash
cat supabase/functions/repair-diagnostic/index.ts
```

2. View function logs:
```bash
supabase functions logs repair-diagnostic
```

3. Manually deploy:
```bash
supabase functions deploy repair-diagnostic --no-verify-jwt
```

## Manual Deployment Commands

### Deploy Function
```bash
supabase functions deploy repair-diagnostic --no-verify-jwt
```

### View Logs
```bash
supabase functions logs repair-diagnostic --follow
```

### List Functions
```bash
supabase functions list
```

### Test Function
```bash
curl -X POST \
  https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -d '{"issue":"test","category":"test"}'
```

## Script Output Example

```
🚀 Starting One-Click Repair Diagnostic Deployment...
==================================================
📋 Checking prerequisites...
✓ Supabase CLI found
🔐 Checking Supabase authentication...
✓ Authenticated
🔗 Linking to Supabase project...
✓ Project linked
🔍 Checking if repair-diagnostic is deployed...
⚠️  Function not found. Will deploy...
🔑 Verifying OPENAI_API_KEY secret...
✓ OPENAI_API_KEY is set
📦 Deploying repair-diagnostic (Attempt 1/3)...
✅ Deployment successful!

📊 Function Details:
URL: https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic

🧪 Testing function...
✓ Function is responding

🎉 Deployment complete!
```

## Admin Dashboard Features

### Deployment Status Card
- Shows current deployment status
- Real-time log viewer
- Retry button on failure
- Success/error notifications

### Deployment Logs
- Timestamped entries
- Color-coded by level (info, success, warning, error)
- Scrollable log viewer
- Auto-updates during deployment

### Status Badges
- **idle**: Ready to deploy
- **checking**: Verifying prerequisites
- **deploying**: Deployment in progress
- **success**: Deployment completed
- **error**: Deployment failed

## Next Steps

After successful deployment:

1. **Test the Function**: Visit the AI chat interface
2. **Monitor Logs**: Check Admin → Diagnostics tab
3. **View Analytics**: Check deployment history in Admin dashboard
4. **Set Up Monitoring**: Configure health checks and alerts

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. View detailed logs in the Admin dashboard
3. Check Supabase function logs
4. Verify all secrets are set correctly
