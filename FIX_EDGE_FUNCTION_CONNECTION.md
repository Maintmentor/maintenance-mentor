# Fix Edge Function Connection Error

## Problem
Getting error: "Failed to send a request to the Edge Function"

## Root Causes
1. Edge function not deployed or outdated
2. CORS headers missing or incorrect
3. Function timeout or crash
4. Missing environment variables

## Solution Steps

### 1. Redeploy Edge Function
```bash
# Deploy the repair-diagnostic function
npx supabase functions deploy repair-diagnostic

# Or use the deploy script
./deploy-edge-functions.sh
```

### 2. Verify Environment Variables
In Supabase Dashboard:
- Go to Edge Functions → Settings
- Verify `OPENAI_API_KEY` is set
- Verify `SUPABASE_URL` is set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### 3. Test Function Directly
```bash
curl -i --location --request POST 'https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"question":"test"}'
```

### 4. Check Function Logs
In Supabase Dashboard:
- Go to Edge Functions → repair-diagnostic
- Click "Logs" tab
- Look for errors or timeout messages

## Quick Fix Command
```bash
# Redeploy all functions
npm run deploy:functions
```
