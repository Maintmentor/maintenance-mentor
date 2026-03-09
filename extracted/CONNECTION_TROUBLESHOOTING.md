# Connection Troubleshooting Guide

## Common Connection Failures

### 1. Slack Webhook Connection Failing

#### Symptoms
- "No active Slack webhooks configured" error
- Test webhook button shows failure
- Alerts not appearing in Slack channel

#### Solutions

**A. Verify Webhook URL**
```bash
# Test webhook directly
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

**B. Check Webhook Configuration**
1. Go to Admin Dashboard → Slack tab
2. Verify webhook is **enabled** (toggle should be ON)
3. Confirm channel name matches your Slack channel
4. Ensure alert types are selected

**C. Verify Slack App Permissions**
1. Go to https://api.slack.com/apps
2. Select your app
3. Navigate to **Incoming Webhooks**
4. Verify webhook is active
5. Check channel permissions

**D. Common Webhook Errors**

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_payload` | Malformed JSON | Check message format |
| `channel_not_found` | Channel doesn't exist | Verify channel name |
| `action_prohibited` | No permissions | Reinstall Slack app |
| `invalid_token` | Webhook revoked | Generate new webhook |

---

### 2. Edge Function Connection Failing

#### Symptoms
- "Failed to fetch" errors
- 404 Not Found responses
- CORS errors in browser console
- Edge function timeouts

#### Solutions

**A. Verify Edge Function Deployment**
```bash
# Check if function is deployed
supabase functions list

# Deploy the function
supabase functions deploy slack-alert-sender
supabase functions deploy api-key-validator
```

**B. Check Function Logs**
```bash
# View real-time logs
supabase functions logs slack-alert-sender

# Check for errors
supabase functions logs slack-alert-sender --tail
```

**C. Test Function Directly**
```bash
# Test with curl
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/slack-alert-sender" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "keyName": "TEST_KEY",
    "alertType": "info",
    "healthScore": 100,
    "errorMessage": "Test alert",
    "lastValidated": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

**D. Common Edge Function Errors**

| Error | Cause | Solution |
|-------|-------|----------|
| `Function not found` | Not deployed | Deploy function |
| `CORS error` | Missing headers | Check corsHeaders |
| `Timeout` | Function too slow | Optimize code |
| `401 Unauthorized` | Invalid API key | Check Supabase keys |

---

### 3. Database Connection Failing

#### Symptoms
- "Failed to connect to database"
- RLS policy errors
- Query timeouts
- "relation does not exist" errors

#### Solutions

**A. Verify Database Tables Exist**
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('slack_webhook_config', 'slack_notifications', 'api_key_validation_history');
```

**B. Run Missing Migrations**
```bash
# Run all migrations
supabase db push

# Or run specific migration
supabase migration up
```

**C. Check RLS Policies**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'slack_webhook_config';
```

**D. Test Database Connection**
1. Go to Supabase Dashboard → Database
2. Run a simple query: `SELECT 1;`
3. If fails, check project status
4. Verify connection pooling settings

---

### 4. Environment Variables Missing

#### Symptoms
- "SUPABASE_URL is not defined"
- "SUPABASE_ANON_KEY is not defined"
- Edge functions fail silently

#### Solutions

**A. Check Local Environment**
```bash
# Verify .env file exists
cat .env

# Required variables:
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
```

**B. Check Edge Function Environment**
```bash
# List secrets
supabase secrets list

# Set missing secrets
supabase secrets set SUPABASE_URL=your_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

**C. Verify in Supabase Dashboard**
1. Go to Project Settings → API
2. Copy Project URL and anon key
3. Update .env file
4. Restart development server

---

### 5. CORS Issues

#### Symptoms
- "Access-Control-Allow-Origin" errors
- Requests blocked by browser
- Works in Postman but not browser

#### Solutions

**A. Verify CORS Headers in Edge Function**
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
```

**B. Handle OPTIONS Requests**
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

**C. Add CORS to All Responses**
```typescript
return new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json', ...corsHeaders }
});
```

---

### 6. Authentication Failures

#### Symptoms
- "Invalid API key" errors
- 401 Unauthorized responses
- "JWT expired" errors

#### Solutions

**A. Verify API Keys**
1. Check Supabase Dashboard → Settings → API
2. Copy fresh anon key and service role key
3. Update .env file
4. Redeploy edge functions with new keys

**B. Check User Authentication**
```typescript
// Verify user is logged in
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // User not authenticated
}
```

**C. Verify Service Role Key**
```bash
# Test with service role key
curl "https://YOUR_PROJECT.supabase.co/rest/v1/slack_webhook_config" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Quick Diagnostic Steps

### Step 1: Check Browser Console
```
F12 → Console tab → Look for errors
```

### Step 2: Check Network Tab
```
F12 → Network tab → Filter by Fetch/XHR → Check failed requests
```

### Step 3: Test Edge Functions
```bash
# Test each function
supabase functions serve slack-alert-sender
```

### Step 4: Check Database
```sql
-- Test connection
SELECT current_database();

-- Check tables
\dt
```

### Step 5: Verify Environment
```bash
# Check all required variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

---

## Still Having Issues?

### Enable Debug Mode

**Frontend:**
```typescript
// Add to your component
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Making request to:', url);
```

**Edge Function:**
```typescript
console.log('Request body:', await req.json());
console.log('Environment:', Deno.env.get('SUPABASE_URL'));
```

### Check Supabase Status
- Visit: https://status.supabase.com
- Check for ongoing incidents

### Review Logs
```bash
# Frontend logs
npm run dev

# Edge function logs
supabase functions logs slack-alert-sender --tail

# Database logs
# Go to Supabase Dashboard → Logs
```

---

## Contact Support

If none of these solutions work:

1. **Check Documentation**: Review SLACK_INTEGRATION_GUIDE.md
2. **GitHub Issues**: Search for similar issues
3. **Supabase Support**: https://supabase.com/support
4. **Community**: https://github.com/supabase/supabase/discussions
