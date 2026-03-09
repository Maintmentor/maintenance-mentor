# Quick Fix: Edge Function Connection Error

## The Problem
You're seeing: "Failed to send a request to the Edge Function"

## Most Common Cause
The edge function needs to be redeployed after recent updates.

## Quick Fix (Choose One)

### Option 1: Redeploy via Supabase CLI
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kudlclzjfihbphehhiii

# Deploy the function
supabase functions deploy repair-diagnostic
```

### Option 2: Manual Redeploy via Dashboard
1. Go to https://supabase.com/dashboard/project/kudlclzjfihbphehhiii
2. Navigate to Edge Functions
3. Find "repair-diagnostic"
4. Click "Redeploy" button

### Option 3: Check Environment Variables
1. Go to Supabase Dashboard → Edge Functions → Settings
2. Verify these secrets exist:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. If missing, add them

## Test the Fix
After redeploying, test in the app:
1. Go to Admin → Edge Function Diagnostics
2. Click "Run Diagnostics"
3. Check if all tests pass

## Still Not Working?

### Check Function Logs
1. Supabase Dashboard → Edge Functions → repair-diagnostic
2. Click "Logs" tab
3. Look for error messages

### Common Issues:
- **Timeout**: Function taking too long (>60s)
- **API Key Invalid**: OpenAI key expired or incorrect
- **CORS Error**: Browser blocking request
- **Network Issue**: Temporary connectivity problem

### Emergency Fallback
If nothing works, the function file is at:
`supabase/functions/repair-diagnostic/index.ts`

You can manually copy/paste it into the Supabase Dashboard editor and save.
