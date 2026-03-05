# Supabase AI Assistant Connection Checklist

## ✅ Pre-Flight Checks

### 1. Environment Variables
```bash
# Check if these are set in your .env file
VITE_SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Edge Function Secrets
```bash
# These must be set in Supabase Dashboard or CLI
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Edge Functions Deployed
```bash
# Check deployment status
supabase functions list

# Should show:
# - repair-diagnostic (deployed)
# - fetch-real-part-images-cached (deployed)
# - health-check (deployed)
```

## 🔧 Diagnostic Tools

### Admin Dashboard Test
1. Navigate to `/admin`
2. Click "Diagnostics" tab
3. Find "AI Assistant Connection Test"
4. Click "Run Tests"
5. Review results:
   - ✅ Supabase Connection
   - ✅ Environment Variables
   - ✅ Edge Functions Health
   - ✅ Repair Diagnostic Function

### Browser Console Check
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors:
   - ❌ CORS errors → Check edge function CORS headers
   - ❌ 404 errors → Deploy edge functions
   - ❌ 401/403 → Check API keys
   - ❌ 500 errors → Check edge function logs

### Network Tab Analysis
1. Open DevTools (F12)
2. Go to Network tab
3. Try sending a message in chat
4. Look for `repair-diagnostic` request
5. Check:
   - Status code (should be 200)
   - Response time (<10s ideal)
   - Response body (should have success: true)

## 🚀 Quick Fixes

### Issue: "Function not found"
```bash
supabase functions deploy repair-diagnostic
```

### Issue: "OpenAI API key not configured"
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### Issue: CORS errors
Check edge function has this at the TOP:
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

### Issue: Timeout errors
- Already handled with retry logic (3 attempts)
- Check edge function logs for slow operations
- Verify OpenAI API is responding

## 📊 Connection Status Indicators

### In Chat Interface
- 🟢 "Analyzing..." = Normal operation
- 🟡 "Retrying connection... (Attempt X/3)" = Temporary issue
- 🔴 "Unable to connect after 3 attempts" = Critical issue

### Expected Response Times
- First message: 3-8 seconds
- Follow-up messages: 2-5 seconds
- With images: 5-12 seconds

## 🔍 Detailed Diagnostics

### Test 1: Basic Supabase Connection
```javascript
const { data, error } = await supabase.from('profiles').select('count').limit(1);
// Should return without error
```

### Test 2: Edge Function Invocation
```javascript
const { data, error } = await supabase.functions.invoke('health-check');
// Should return { status: 'ok' }
```

### Test 3: AI Assistant Function
```javascript
const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test', userId: 'test' }
});
// Should return { success: true, answer: '...' }
```

## 📝 Logging and Monitoring

### View Real-time Logs
```bash
supabase functions logs repair-diagnostic --tail
```

### Check Recent Errors
1. Supabase Dashboard
2. Edge Functions
3. Select `repair-diagnostic`
4. View Logs tab
5. Filter by "error"

## 🎯 Success Criteria

All checks should pass:
- [x] Environment variables configured
- [x] Edge functions deployed
- [x] CORS headers properly set
- [x] OpenAI API key valid and working
- [x] Retry logic functioning (3 attempts)
- [x] Response times under 10 seconds
- [x] No CORS errors in console
- [x] No 404/500 errors
- [x] Chat returns AI responses
- [x] Images are fetched and displayed

## 🆘 Still Having Issues?

1. Run the AI Assistant Connection Test in Admin Dashboard
2. Check browser console for detailed error messages
3. Review edge function logs in Supabase Dashboard
4. Verify all environment variables are set correctly
5. Ensure edge functions are deployed and running
6. Test with a simple question: "test connection"
7. Check network tab for request/response details

## 📞 Support Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OpenAI API Status](https://status.openai.com/)
- AI_ASSISTANT_CONNECTION_DIAGNOSTIC.md (this repo)
- EDGE_FUNCTION_RETRY_IMPLEMENTATION.md (this repo)
