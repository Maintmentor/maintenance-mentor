# AI Assistant Connection Diagnostic Guide

## 🔍 Overview
This guide helps diagnose and fix connection issues between the AI Assistant and Supabase Edge Functions.

## 🧪 Running Diagnostics

### Method 1: Admin Dashboard
1. Navigate to `/admin` in your application
2. Go to the "Diagnostics" tab
3. Find "AI Assistant Connection Test"
4. Click "Run Tests"
5. Review the results for any errors

### Method 2: Browser Console
Open browser console (F12) and check for:
- CORS errors
- Network timeouts
- 401/403 authentication errors
- 500 server errors

## 🔧 Common Issues and Fixes

### Issue 1: CORS Policy Error
**Symptoms:** 
- "Access to fetch has been blocked by CORS policy"
- Preflight request fails

**Fix:**
```typescript
// Ensure edge function has CORS headers at the TOP
serve(async (req) => {
  // THIS MUST BE FIRST
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Rest of your code...
});
```

### Issue 2: Function Not Deployed
**Symptoms:**
- 404 Not Found
- "Function does not exist"

**Fix:**
```bash
# Deploy edge functions
supabase functions deploy repair-diagnostic
supabase functions deploy fetch-real-part-images-cached
```

### Issue 3: Missing Environment Variables
**Symptoms:**
- "OpenAI API key not configured"
- Function returns 500 error

**Fix:**
```bash
# Set edge function secrets
supabase secrets set OPENAI_API_KEY=your_key_here
supabase secrets set SUPABASE_URL=your_url_here
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Issue 4: Timeout Errors
**Symptoms:**
- Request takes >60 seconds
- "Request timeout"

**Fix:**
- Implemented automatic retry with exponential backoff
- Retries 3 times: 1s, 3s, 5s delays
- Check edge function logs for slow operations

## 📊 Test Results Interpretation

### ✅ Success Status
- All systems operational
- No action needed

### ⚠️ Warning Status
- Function works but has issues
- Review details for optimization

### ❌ Error Status
- Critical failure
- Immediate action required

## 🚀 Quick Fix Commands

```bash
# 1. Check function status
supabase functions list

# 2. View function logs
supabase functions logs repair-diagnostic

# 3. Redeploy functions
supabase functions deploy repair-diagnostic

# 4. Test locally
supabase functions serve repair-diagnostic

# 5. Check secrets
supabase secrets list
```

## 📝 Monitoring

### Real-time Logs
```bash
supabase functions logs repair-diagnostic --tail
```

### Check Recent Errors
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select `repair-diagnostic`
4. View Logs tab
5. Filter by error level

## 🔄 Retry Logic

The system now includes automatic retry:
- **Attempt 1:** Immediate
- **Attempt 2:** After 1 second
- **Attempt 3:** After 3 seconds (total 4s)
- **Attempt 4:** After 5 seconds (total 9s)

Visual indicator shows: "Retrying connection... (Attempt X/3)"

## 📞 Support

If issues persist after following this guide:
1. Check browser console for detailed errors
2. Review Supabase function logs
3. Verify all environment variables are set
4. Ensure edge functions are deployed
5. Test with the diagnostic tool

## 🎯 Success Checklist

- [ ] Supabase connection working
- [ ] Environment variables configured
- [ ] Edge functions deployed
- [ ] CORS headers properly set
- [ ] OpenAI API key valid
- [ ] Retry logic functioning
- [ ] No timeout errors
