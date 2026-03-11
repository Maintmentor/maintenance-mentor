# Edge Functions Deployment & Health Check Guide

## 🚀 Quick Start

### 1. Deploy All Functions
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### 2. Validate Deployment
```bash
node validate-deployment.js
```

### 3. Access Health Dashboard
Navigate to `/admin/health` in your application to see real-time status.

## 📋 Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Logged in to Supabase: `supabase login`
- Environment variables configured

## 🔐 Required Environment Variables

Set these secrets in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set GOOGLE_API_KEY=AIza...
supabase secrets set GOOGLE_CSE_ID=...
```

## 🏥 Health Check System

### Manual Health Check
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/health-check \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Automated Monitoring
- GitHub Actions runs health checks every 6 hours
- Creates issues automatically when failures detected
- Dashboard auto-refreshes every minute

## 📊 Health Dashboard Features

1. **Overall System Status** - Quick view of system health
2. **External Dependencies** - OpenAI, Stripe, Resend, Google APIs
3. **Edge Functions** - Individual function testing and status
4. **Auto-refresh** - Updates every 60 seconds
5. **Manual Testing** - Test individual functions on-demand

## 🔧 Troubleshooting

### Function Not Responding
1. Check deployment status: `supabase functions list`
2. View logs: `supabase functions logs FUNCTION_NAME`
3. Redeploy: `supabase functions deploy FUNCTION_NAME`

### API Key Issues
1. Verify secrets: `supabase secrets list`
2. Update secret: `supabase secrets set KEY_NAME=value`
3. Restart function (redeploy)

### CORS Errors
- Ensure `corsHeaders` are included in all function responses
- Check OPTIONS method handling

## 🔄 CI/CD Workflows

### Automatic Deployment
- Triggers on push to `main` branch
- Deploys all functions in `supabase/functions/`
- Validates deployment automatically

### Scheduled Testing
- Runs every 6 hours
- Creates GitHub issues on failure
- Monitors all critical functions

### Manual Rollback
- Trigger via GitHub Actions UI
- Specify function name and version
- Validates after rollback

## 📈 Monitoring Best Practices

1. **Check Dashboard Daily** - Review health status
2. **Monitor Logs** - Watch for errors and warnings
3. **Test After Changes** - Always validate after deployment
4. **Set Up Alerts** - Configure notifications for failures
5. **Review Metrics** - Track response times and error rates

## 🆘 Emergency Procedures

### All Functions Down
```bash
# 1. Check Supabase status
curl https://status.supabase.com

# 2. Redeploy all functions
./deploy-functions.sh

# 3. Validate
node validate-deployment.js
```

### Single Function Failure
```bash
# 1. Check logs
supabase functions logs FUNCTION_NAME

# 2. Redeploy
supabase functions deploy FUNCTION_NAME

# 3. Test
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/FUNCTION_NAME \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 📞 Support

- Check logs: `supabase functions logs`
- View dashboard: `/admin/health`
- GitHub Issues: Create issue with logs attached
