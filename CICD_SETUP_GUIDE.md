# CI/CD Pipeline Setup Guide for Supabase Edge Functions

## Overview
This guide covers the complete setup of an automated CI/CD pipeline for deploying Supabase edge functions using GitHub Actions.

## Features
- ✅ Automatic deployment on push to main/production
- ✅ API key validation before deployment
- ✅ Comprehensive testing (unit, integration, performance, security)
- ✅ Health checks after deployment
- ✅ Rollback capabilities
- ✅ Slack and email notifications
- ✅ Deployment history tracking

## Prerequisites

### 1. Supabase Setup
- Supabase project created
- Supabase CLI installed locally
- Edge functions created in `supabase/functions/`

### 2. GitHub Repository
- Code pushed to GitHub
- Admin access to configure secrets

## Configuration Steps

### Step 1: Get Supabase Credentials

1. **Get Supabase Access Token:**
   ```bash
   npx supabase login
   # This will open browser for authentication
   # Token is saved in ~/.supabase/access-token
   cat ~/.supabase/access-token
   ```

2. **Get Project ID:**
   - Go to https://app.supabase.com/project/_/settings/general
   - Copy the Reference ID (looks like: abcdefghijklmnop)

### Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these required secrets:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access token | From Step 1.1 |
| `SUPABASE_PROJECT_ID` | Your project reference ID | From Step 1.2 |
| `OPENAI_API_KEY` | OpenAI API key for AI features | https://platform.openai.com/api-keys |
| `SLACK_WEBHOOK_URL` | (Optional) Slack webhook for notifications | https://api.slack.com/messaging/webhooks |
| `SENDGRID_API_KEY` | (Optional) SendGrid API key for emails | https://sendgrid.com/docs/ui/account-and-settings/api-keys/ |
| `NOTIFICATION_EMAIL` | (Optional) Email for notifications | Your email address |

### Step 3: Create Test Files

For each edge function, create a test file:

```typescript
// supabase/functions/repair-diagnostic/test.ts
import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("repair-diagnostic health check", async () => {
  const response = await fetch("http://localhost:54321/functions/v1/repair-diagnostic/health");
  assertEquals(response.status, 200);
});
```

### Step 4: Enable GitHub Actions

1. Go to repository → Actions tab
2. Enable workflows if not already enabled
3. Commit the workflow files to `.github/workflows/`

## Usage

### Automatic Deployment

Push to main branch triggers automatic deployment:
```bash
git add .
git commit -m "feat: update edge functions"
git push origin main
```

### Manual Deployment

1. Go to Actions tab
2. Select "Deploy Edge Functions to Supabase"
3. Click "Run workflow"
4. Select environment (staging/production)
5. Click "Run workflow"

### Running Tests

Tests run automatically on pull requests:
```bash
git checkout -b feature/new-function
# Make changes
git push origin feature/new-function
# Create PR - tests will run automatically
```

### Rollback Deployment

If deployment causes issues:

1. Go to Actions tab
2. Select "Rollback Edge Functions"
3. Click "Run workflow"
4. Enter:
   - Deployment ID (from previous deployment)
   - Reason for rollback
   - Environment
5. Click "Run workflow"

## Monitoring

### Deployment Status
- Check Actions tab for deployment history
- Download deployment records from artifacts
- Monitor Slack channel for notifications

### Health Checks
After each deployment:
- Automatic health checks run
- Failed checks trigger notifications
- Manual checks: `curl https://YOUR_PROJECT.supabase.co/functions/v1/FUNCTION_NAME/health`

### Logs
View function logs:
```bash
supabase functions logs repair-diagnostic --project-ref YOUR_PROJECT_ID
```

## Troubleshooting

### Deployment Fails

1. **Check secrets are set correctly:**
   ```bash
   # Verify locally
   supabase functions deploy repair-diagnostic --project-ref YOUR_PROJECT_ID
   ```

2. **Check function syntax:**
   ```bash
   deno check supabase/functions/repair-diagnostic/index.ts
   ```

3. **Review GitHub Actions logs:**
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed step

### Health Checks Fail

1. **Check function logs:**
   ```bash
   supabase functions logs FUNCTION_NAME --project-ref YOUR_PROJECT_ID
   ```

2. **Verify API keys in Supabase:**
   ```bash
   supabase secrets list --project-ref YOUR_PROJECT_ID
   ```

3. **Test locally:**
   ```bash
   supabase functions serve FUNCTION_NAME --env-file .env.local
   ```

### Notifications Not Working

1. **Slack notifications:**
   - Verify webhook URL is correct
   - Test webhook: `curl -X POST -H 'Content-Type: application/json' -d '{"text":"Test"}' YOUR_WEBHOOK_URL`

2. **Email notifications:**
   - Verify SendGrid API key
   - Check SendGrid dashboard for bounces/blocks

## Best Practices

1. **Always test locally first:**
   ```bash
   supabase functions serve repair-diagnostic --env-file .env.local
   ```

2. **Use staging environment:**
   - Deploy to staging first
   - Test thoroughly
   - Then deploy to production

3. **Monitor after deployment:**
   - Watch logs for errors
   - Check health endpoints
   - Monitor user reports

4. **Keep deployment records:**
   - Download artifacts for audit trail
   - Document rollback reasons
   - Track deployment frequency

## Advanced Configuration

### Custom Health Checks

Add to your edge function:
```typescript
// Handle health check endpoint
if (url.pathname === '/health') {
  return new Response(JSON.stringify({ 
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}
```

### Environment-Specific Configs

Use GitHub environments for different settings:
1. Go to Settings → Environments
2. Create "staging" and "production"
3. Add environment-specific secrets
4. Configure protection rules

### Performance Monitoring

Add custom metrics:
```typescript
const startTime = Date.now();
// Your function logic
const duration = Date.now() - startTime;
console.log(`Function executed in ${duration}ms`);
```

## Support

- GitHub Actions docs: https://docs.github.com/actions
- Supabase CLI docs: https://supabase.com/docs/guides/cli
- Slack webhooks: https://api.slack.com/messaging/webhooks
- SendGrid docs: https://sendgrid.com/docs/