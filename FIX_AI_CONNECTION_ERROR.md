# 🔧 Fix: AI Assistant Connection Error

## Error Message
```
⚠️ Unable to connect to AI service after 3 retry attempts.
🔄 Error Details: Edge function error: Failed to send a request to the Edge Function
```

## ✅ Your Configuration
Your app is correctly configured to use:
- **Supabase URL**: `https://kudlclzjfihbphehhiii.supabase.co`
- **Edge Function**: `https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic`

## 🎯 Quick Fix (Most Common)

### Step 1: Check if Edge Function is Deployed
```bash
# Check function status
curl -I https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic

# Should return: HTTP/2 200 or HTTP/2 405
# If you get 404, the function is NOT deployed
```

### Step 2: Deploy the Edge Function
```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref kudlclzjfihbphehhiii

# Deploy the function
supabase functions deploy repair-diagnostic
```

### Step 3: Set Required Secrets
The edge function needs the OpenAI API key to work:

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

Or set it in the Supabase Dashboard:
1. Go to https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/functions
2. Click "Edge Functions" → "Secrets"
3. Add secret: `OPENAI_API_KEY` = your OpenAI key

### Step 4: Test the Connection
```bash
curl -X POST "https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question":"test","images":[]}'
```

## 🔍 Detailed Troubleshooting

### Issue 1: Function Not Deployed
**Symptoms**: 404 error, "Function not found"

**Solution**:
```bash
# Deploy all functions
cd supabase/functions
supabase functions deploy repair-diagnostic
```

### Issue 2: Missing OpenAI API Key
**Symptoms**: Function deploys but returns error about missing API key

**Solution**:
1. Get API key from https://platform.openai.com/api-keys
2. Set in Supabase:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

### Issue 3: Invalid Anon Key
**Symptoms**: 401 Unauthorized error

**Solution**:
1. Get correct anon key from https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/api
2. Update `.env`:
   ```env
   VITE_SUPABASE_ANON_KEY=your-correct-key
   ```
3. Restart dev server: `npm run dev`

### Issue 4: CORS / Network Issues
**Symptoms**: "Failed to fetch", "Network error"

**Solution**:
- Check browser console for detailed error
- Verify Supabase project is active
- Check https://status.supabase.com for outages
- Try from different network/browser

### Issue 5: Function Timeout
**Symptoms**: Request takes too long, then fails

**Solution**:
```bash
# Increase function timeout (in function code)
# supabase/functions/repair-diagnostic/index.ts
Deno.serve({
  handler: async (req) => {
    // Your code
  },
  timeout: 60000 // 60 seconds
});
```

## 🧪 Test Your Fix

### In Browser Console (F12)
```javascript
// Test edge function directly
fetch('https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    question: 'test connection',
    images: []
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Expected Success Response
```json
{
  "success": true,
  "answer": "...",
  "partImages": [],
  "generatedImage": null
}
```

## 📋 Verification Checklist

- [ ] Edge function deployed: `supabase functions list`
- [ ] OpenAI API key set: Check Supabase Dashboard → Secrets
- [ ] Anon key correct in `.env` file
- [ ] Dev server restarted after .env changes
- [ ] Function returns 200 status code when tested with curl
- [ ] Browser console shows no CORS errors

## 🚀 Automated Fix

Use the Auto-Deployment Banner in your app:
1. Look for yellow banner at top-right of app
2. Click "Deploy Now"
3. Wait for deployment to complete
4. Refresh page and test AI assistant

## 📞 Still Not Working?

1. **Check Function Logs**:
   - Go to https://app.supabase.com/project/kudlclzjfihbphehhiii/functions
   - Click on `repair-diagnostic`
   - View recent logs for errors

2. **Verify All Environment Variables**:
   ```bash
   # In your project root
   cat .env
   
   # Should show:
   # VITE_SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co
   # VITE_SUPABASE_ANON_KEY=eyJ...
   ```

3. **Check Supabase Project Status**:
   - Visit https://app.supabase.com/project/kudlclzjfihbphehhiii
   - Ensure project is active (not paused)

4. **Test with Diagnostic Tool**:
   - Go to Admin page in your app
   - Find "AI Connection Diagnostic" card
   - Click "Run Diagnostic Test"
   - Review detailed results

## 💡 Prevention

To avoid this error in the future:

1. **Use CI/CD**: Set up automatic deployment (see EDGE_FUNCTION_AUTO_DEPLOYMENT.md)
2. **Monitor Health**: Enable health check monitoring
3. **Set All Secrets**: Ensure all required secrets are configured
4. **Test After Deploy**: Always test functions after deployment

---

**Last Updated**: October 27, 2025  
**Target URL**: https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic
