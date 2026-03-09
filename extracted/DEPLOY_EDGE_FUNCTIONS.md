# Automated Edge Function Deployment Guide

## 🚀 Quick Start

Deploy all edge functions with a single command:

```bash
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

## 📋 What It Does

The script automatically:

1. ✅ Checks Supabase CLI installation
2. ✅ Validates environment variables
3. ✅ Scans for local edge functions
4. ✅ Deploys all existing functions
5. ✅ Tests deployed functions
6. ✅ Generates deployment report

## 🎯 Functions Deployed

- `health-check` - System health monitoring
- `repair-diagnostic` - AI-powered repair analysis
- `slack-alert-sender` - Slack notification integration
- `storage-monitor` - Storage usage tracking
- `api-key-validator` - API key validation
- `trial-reminder-email` - Trial expiration reminders
- `cache-alert-email-sender` - Cache alert notifications
- `image-cache-handler` - Image caching system

## 📦 Prerequisites

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Configure Environment

Ensure `.env` contains:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Login to Supabase

```bash
supabase login
supabase link --project-ref your-project-ref
```

## 🔧 Usage

### Deploy All Functions

```bash
./deploy-edge-functions.sh
```

### Deploy Single Function

```bash
supabase functions deploy health-check --no-verify-jwt
```

### View Function Logs

```bash
supabase functions logs health-check
```

### Test Function Locally

```bash
supabase functions serve health-check
```

## 📊 Deployment Report

After deployment, check the generated report:
```
deployment-report-YYYYMMDD-HHMMSS.txt
```

Contains:
- Deployed functions list
- Missing functions
- Deployment timestamp

## 🐛 Troubleshooting

### Error: "Supabase CLI not found"
```bash
npm install -g supabase
```

### Error: "Missing Supabase credentials"
1. Copy `.env.example` to `.env`
2. Add your Supabase URL and anon key
3. Run script again

### Error: "Failed to deploy function"
1. Check function code for errors
2. Verify Supabase project is linked
3. Check logs: `supabase functions logs <function-name>`

### Function not responding after deployment
- Wait 30-60 seconds for cold start
- Check Supabase dashboard for errors
- Verify JWT settings if needed

## 🔄 CI/CD Integration

### GitHub Actions

The script is integrated with GitHub Actions:

```yaml
# .github/workflows/deploy-edge-functions.yml
name: Deploy Edge Functions
on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/**'
```

Automatically deploys when functions are updated.

## 📝 Manual Deployment Steps

If script fails, deploy manually:

```bash
# 1. Navigate to functions directory
cd supabase/functions

# 2. Deploy each function
supabase functions deploy health-check --no-verify-jwt
supabase functions deploy repair-diagnostic --no-verify-jwt
supabase functions deploy slack-alert-sender --no-verify-jwt

# 3. Test deployment
curl -X POST https://your-project.supabase.co/functions/v1/health-check \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 🔐 Security Notes

- Never commit `.env` file
- Use `--no-verify-jwt` only for public endpoints
- Protect sensitive functions with RLS policies
- Rotate API keys regularly

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deployment Best Practices](https://supabase.com/docs/guides/functions/deploy)
- [Function Monitoring](https://supabase.com/docs/guides/functions/logging)

## 🆘 Support

If issues persist:
1. Check `deployment-report-*.txt` for details
2. Review Supabase dashboard logs
3. Verify all environment variables
4. Test connection with `./fix-connection.sh`
