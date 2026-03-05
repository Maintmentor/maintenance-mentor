# OpenAI API Key Setup Guide

## Step 1: Get Your OpenAI API Key

1. **Go to OpenAI Platform**
   - Visit: https://platform.openai.com/api-keys
   - Sign in with your OpenAI account (or create one)

2. **Create New API Key**
   - Click "Create new secret key"
   - Give it a name (e.g., "PoolPro AI Assistant")
   - Copy the key immediately (starts with `sk-proj-...`)
   - **IMPORTANT**: Save this key securely - you won't be able to see it again!

## Step 2: Add to Netlify (Frontend)

### Via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your site (poolpro-ai or your site name)

2. **Navigate to Environment Variables**
   - Click "Site configuration" in the left sidebar
   - Click "Environment variables"
   - Click "Add a variable"

3. **Add the OpenAI API Key**
   ```
   Key: VITE_OPENAI_API_KEY
   Value: sk-proj-your-actual-key-here
   Scopes: All (Production, Preview, Deploy Preview)
   ```

4. **Save and Deploy**
   - Click "Create variable"
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

### Via Netlify CLI (Alternative)

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Set the environment variable
netlify env:set VITE_OPENAI_API_KEY "sk-proj-your-actual-key-here"

# Deploy
netlify deploy --prod
```

## Step 3: Add to Supabase (Backend - CRITICAL)

The AI agent runs on Supabase Edge Functions and needs the key there too:

```bash
# Login to Supabase CLI
supabase login

# Link to your project (get project-ref from Supabase dashboard)
supabase link --project-ref your-project-ref

# Set the secret
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here

# Deploy the edge function
supabase functions deploy repair-diagnostic
```

## Step 4: Verify Setup

### Check Netlify
1. Go to your deployed site
2. Open browser console (F12)
3. Check if AI features are working

### Check Supabase
```bash
# List secrets to confirm (won't show values)
supabase secrets list

# Test the edge function
curl -X POST https://your-project.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"query": "test"}'
```

## Environment Variables Needed

### Netlify (.env for local, Environment Variables for production)
```
VITE_OPENAI_API_KEY=sk-proj-...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Secrets
```
OPENAI_API_KEY=sk-proj-...
```

## Troubleshooting

### "API key not found" Error
- Ensure the key is set in BOTH Netlify and Supabase
- Check for typos in the variable name
- Verify the key starts with `sk-proj-`

### "Invalid API key" Error
- Your key might be expired or revoked
- Generate a new key from OpenAI platform
- Update in both Netlify and Supabase

### AI Agent Not Working
1. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs repair-diagnostic
   ```

2. Verify the key is in Supabase secrets:
   ```bash
   supabase secrets list
   ```

3. Redeploy the edge function:
   ```bash
   supabase functions deploy repair-diagnostic --no-verify-jwt
   ```

## Security Best Practices

1. **Never commit API keys to Git**
   - Keep them in .env.local (gitignored)
   - Use environment variables in production

2. **Use different keys for different environments**
   - Development: Limited usage key
   - Production: Production key with billing alerts

3. **Set usage limits in OpenAI**
   - Go to OpenAI platform → Usage limits
   - Set monthly spending limits

4. **Rotate keys regularly**
   - Generate new keys every 3-6 months
   - Update in all locations

## Quick Checklist

- [ ] Created OpenAI account
- [ ] Generated API key
- [ ] Added to Netlify environment variables
- [ ] Added to Supabase secrets
- [ ] Deployed Netlify site
- [ ] Deployed Supabase edge function
- [ ] Tested AI features on live site

## Need Help?

If the AI agent still doesn't work after following these steps:

1. Check the diagnostic tool:
   ```bash
   node diagnose-ai-agent.js
   ```

2. Review the troubleshooting guide:
   - See `AI_AGENT_TROUBLESHOOTING.md`

3. Check the logs:
   - Netlify: Function logs in dashboard
   - Supabase: `supabase functions logs repair-diagnostic`