# Edge Functions Deployment Guide

## 🚀 Quick Start

### 1. Deploy All Functions
```bash
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

### 2. Validate Deployment
```bash
node validate-deployment.js
```

### 3. Access Health Dashboard
Navigate to `/admin/health` in your application to see real-time status.

---

## Part 1 — Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Authenticated: `supabase login`
- Project linked: `supabase link --project-ref YOUR_PROJECT_REF`
- `.env` file present with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## Part 2 — Required Secrets

Set these secrets in **Supabase Dashboard → Project Settings → Edge Functions → Secrets** or via the CLI.

### Core Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-...          # AI-powered repair diagnostics
supabase secrets set STRIPE_SECRET_KEY=sk_...       # Payment processing
supabase secrets set RESEND_API_KEY=re_...          # Transactional email delivery
```

### Critical: Image Functions

The following secrets are **required** for the 3 image edge functions to work:

```bash
supabase secrets set GOOGLE_API_KEY=AIzaSy...   # Google Custom Search API — used by fetch-real-part-images
                                                 # and fetch-real-part-images-cached to look up part photos
supabase secrets set GOOGLE_CSE_ID=017...        # Custom Search Engine ID — identifies the search engine
                                                 # configured for part-image lookups
supabase secrets set OPENAI_API_KEY=sk-...       # OpenAI Images API — used by generate-repair-image
                                                 # to generate AI repair illustrations (set above if not already)
```

#### Quick deploy for image functions only

```bash
supabase functions deploy fetch-real-part-images fetch-real-part-images-cached generate-repair-image --no-verify-jwt
```

📋 **For a full step-by-step deployment guide for these three functions** — including multiple deployment options, verification steps, troubleshooting, and rollback instructions — see:

> [`docs/DEPLOY_IMAGE_FUNCTIONS_CHECKLIST.md`](./DEPLOY_IMAGE_FUNCTIONS_CHECKLIST.md)

---

## Part 3 — Health Check System

### Manual Health Check
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/health-check \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Automated Monitoring
- GitHub Actions runs health checks every 6 hours
- Creates issues automatically when failures are detected
- Dashboard auto-refreshes every minute

---

## Part 4 — Health Dashboard Features

1. **Overall System Status** — Quick view of system health
2. **External Dependencies** — OpenAI, Stripe, Resend, Google APIs
3. **Edge Functions** — Individual function testing and status
4. **Auto-refresh** — Updates every 60 seconds
5. **Manual Testing** — Test individual functions on demand

---

## Part 5 — Troubleshooting

### Function Not Responding
1. Check deployment status: `supabase functions list`
2. View logs: `supabase functions logs FUNCTION_NAME`
3. Redeploy: `supabase functions deploy FUNCTION_NAME --no-verify-jwt`

### API Key Issues
1. Verify secrets: `supabase secrets list`
2. Update a secret: `supabase secrets set KEY_NAME=value`
3. Restart function by redeploying it

### CORS Errors
- Ensure `corsHeaders` are included in all function responses
- Check that `OPTIONS` preflight requests are handled

### Image Function Issues
See the dedicated troubleshooting section in [`docs/DEPLOY_IMAGE_FUNCTIONS_CHECKLIST.md`](./DEPLOY_IMAGE_FUNCTIONS_CHECKLIST.md#part-6--troubleshooting).

---

## Part 6 — CI/CD Workflows

### Automatic Deployment
- Triggers on push to `main` branch when files under `supabase/functions/` change
- Deploys all functions listed in `.github/workflows/deploy-edge-functions.yml`
- Validates deployment automatically

### Scheduled Testing
- Runs every 6 hours via `health-check-monitoring.yml`
- Creates GitHub issues on failure
- Monitors all critical functions

### Manual Rollback
- Trigger `rollback-edge-functions.yml` via the GitHub Actions UI
- Specify the function name and version
- Validates after rollback

---

## Part 7 — Emergency Procedures

### All Functions Down
```bash
# 1. Check Supabase status
curl https://status.supabase.com

# 2. Redeploy all functions
./deploy-edge-functions.sh

# 3. Validate
node validate-deployment.js
```

### Single Function Failure
```bash
# 1. Check logs
supabase functions logs FUNCTION_NAME

# 2. Redeploy
supabase functions deploy FUNCTION_NAME --no-verify-jwt

# 3. Test
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/FUNCTION_NAME \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📞 Support

- View logs: `supabase functions logs`
- Health dashboard: `/admin/health`
- GitHub Issues: create an issue with logs attached
- Image functions checklist: [`docs/DEPLOY_IMAGE_FUNCTIONS_CHECKLIST.md`](./DEPLOY_IMAGE_FUNCTIONS_CHECKLIST.md)
