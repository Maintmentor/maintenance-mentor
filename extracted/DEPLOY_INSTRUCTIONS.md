# 🚀 Complete Edge Function Deployment Guide

## 🎯 Quick Start - One-Click Deployment

### Method 1: Shell Script (Recommended for CLI Users)

```bash
# Make executable
chmod +x deploy-repair-diagnostic-one-click.sh

# Run deployment
./deploy-repair-diagnostic-one-click.sh
```

**What it does:**
- ✅ Checks prerequisites (Supabase CLI, authentication)
- ✅ Verifies OpenAI API key is set
- ✅ Deploys repair-diagnostic function
- ✅ Automatic retry (3 attempts with 5s delay)
- ✅ Tests the deployed function
- ✅ Shows detailed status with color-coded output

### Method 2: Admin Dashboard (Visual Interface)

1. Navigate to `/admin` in your browser
2. Click the **"Deploy"** tab
3. Find the **"One-Click Deployment"** card
4. Click **"Deploy Now"**
5. Watch real-time logs and progress

**Features:**
- 📊 Real-time deployment logs with timestamps
- 🎨 Color-coded status (info, success, warning, error)
- 🔄 Automatic retry on failure
- ✅ Success/failure notifications
- 📍 Shows exact Supabase URL being targeted

### Method 3: Startup Auto-Check

The app automatically checks on startup if edge functions are deployed:

1. **Banner appears** if functions are missing
2. Shows **exact URL** being called
3. Click **"Deploy Now"** for one-click deployment
4. **Progress indicator** shows deployment status
5. **Success/error notifications** appear

## 📋 Prerequisites

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### 2. Login to Supabase

```bash
supabase login
```

This opens a browser for authentication.

### 3. Set OpenAI API Key

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

Verify it's set:
```bash
supabase secrets list
```

Should show:
```
OPENAI_API_KEY | ****...****
```

## 🔍 Verify Deployment

### Check if Function is Deployed

```bash
supabase functions list
```

Look for `repair-diagnostic` in the output.

### Test the Function

**Via cURL:**
```bash
curl -X POST \
  https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -d '{"issue":"test","category":"test"}'
```

**Via Admin Dashboard:**
1. Go to `/admin`
2. Click **"Diagnostics"** tab
3. Use **"AI Assistant Connection Test"**
4. Click **"Test Connection"**

**Via App Interface:**
1. Open the chat interface
2. Ask a repair question
3. Verify AI responds with detailed steps

## 📊 Deployment Features

### Automatic Retry Logic

The deployment system includes intelligent retry:

1. **Attempt 1**: Initial deployment
2. **5-second wait** if failed
3. **Attempt 2**: Retry with same parameters
4. **5-second wait** if failed
5. **Attempt 3**: Final attempt
6. **Exit with error** if all attempts fail

### Rollback on Failure

- Previous version remains active if deployment fails
- No partial deployments
- Safe to retry without data loss

### Real-Time Monitoring

**Shell Script Output:**
```
🚀 Starting One-Click Repair Diagnostic Deployment...
📋 Checking prerequisites...
✓ Supabase CLI found
✓ Authenticated
✓ Project linked
🔑 Verifying OPENAI_API_KEY...
✓ OPENAI_API_KEY is set
📦 Deploying repair-diagnostic (Attempt 1/3)...
✅ Deployment successful!
🧪 Testing function...
✓ Function is responding
🎉 Deployment complete!
```

**Admin Dashboard:**
- Timestamped log entries
- Color-coded by severity
- Scrollable log viewer
- Status badges (idle, checking, deploying, success, error)

## 🔧 Troubleshooting

### Error: "Supabase CLI not found"

**Solution:**
```bash
npm install -g supabase
```

### Error: "Not logged in to Supabase"

**Solution:**
```bash
supabase login
```

### Error: "OPENAI_API_KEY not found"

**Solution:**
```bash
# Set the secret
supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Verify
supabase secrets list
```

### Error: "Deployment failed after 3 attempts"

**Diagnosis Steps:**

1. **Check function code:**
   ```bash
   cat supabase/functions/repair-diagnostic/index.ts
   ```

2. **View function logs:**
   ```bash
   supabase functions logs repair-diagnostic
   ```

3. **Check for syntax errors:**
   ```bash
   cd supabase/functions/repair-diagnostic
   deno check index.ts
   ```

4. **Manual deploy with debug:**
   ```bash
   supabase functions deploy repair-diagnostic --no-verify-jwt --debug
   ```

### Error: "Function not responding"

**Possible causes:**
- Cold start (first request takes 5-10 seconds)
- Missing OpenAI API key
- Function not deployed
- Network issues

**Solutions:**
1. Wait 10 seconds and retry
2. Check secrets: `supabase secrets list`
3. Redeploy: `./deploy-repair-diagnostic-one-click.sh`
4. Check logs: `supabase functions logs repair-diagnostic`

### Error: "404 Not Found"

**Cause:** Function not deployed

**Solution:**
```bash
./deploy-repair-diagnostic-one-click.sh
```

### Error: "401 Unauthorized"

**Cause:** Invalid Supabase credentials

**Solution:**
1. Check `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify in Admin → API Keys tab
3. Re-login: `supabase login`

## 📈 Monitoring & Logs

### View Real-Time Logs

```bash
supabase functions logs repair-diagnostic --follow
```

### View Recent Logs

```bash
supabase functions logs repair-diagnostic
```

### Admin Dashboard Monitoring

**Deploy Tab:**
- Deployment history
- Function status
- Manual deployment controls

**Diagnostics Tab:**
- Connection status
- Function health checks
- Error diagnostics

**API Keys Tab:**
- Secret verification
- Key status
- Missing key alerts

## 🎯 Target URL

All deployments target:
```
https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic
```

This URL is:
- ✅ Hardcoded in deployment scripts
- ✅ Shown in error messages
- ✅ Displayed in Admin dashboard
- ✅ Used for all function calls

## 🔐 Security Notes

- Function uses `--no-verify-jwt` (public access for demo)
- OpenAI API key stored securely in Supabase secrets
- Never exposed in frontend code
- Rate limiting recommended for production

## 📚 Additional Resources

- **Detailed Guide:** See `DEPLOY_REPAIR_DIAGNOSTIC.md`
- **Script Usage:** See `RUN_DEPLOYMENT_SCRIPT.md`
- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **OpenAI Docs:** https://platform.openai.com/docs

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. View logs: `supabase functions logs repair-diagnostic`
3. Check Admin Dashboard → Diagnostics tab
4. Verify secrets: `supabase secrets list`
5. Try manual deployment with `--debug` flag
