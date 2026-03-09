# AI Connection Error Troubleshooting Guide

## Error: "I'm having trouble connecting to the AI service"

This error occurs when the OpenAI API call fails. Here's how to diagnose and fix it:

---

## Step 1: Check Supabase Edge Function Logs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Edge Functions** → **repair-diagnostic**
4. Click on **Logs** tab
5. Look for recent error messages

### Common Error Messages:

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `OpenAI API key is invalid or not configured` | Missing or wrong API key | Set OPENAI_API_KEY in Supabase secrets |
| `OpenAI API rate limit exceeded` | Too many requests | Wait 1 minute and try again |
| `OpenAI service is temporarily unavailable` | OpenAI downtime | Wait and retry |
| `Request timeout` | Slow network/API | Normal - retry in a moment |

---

## Step 2: Verify OpenAI API Key

### Check if Key is Set:
```bash
# Using Supabase CLI
supabase secrets list

# You should see OPENAI_API_KEY in the list
```

### Set/Update the Key:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### Verify Key is Valid:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Check if your API key is active
3. Verify you have credits/billing set up
4. Test the key with a simple curl request:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-your-key" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## Step 3: Check OpenAI Account Status

### Verify:
- ✅ Billing is set up
- ✅ You have available credits
- ✅ No rate limit restrictions
- ✅ API key has proper permissions

### Check at:
https://platform.openai.com/account/billing

---

## Step 4: Redeploy Edge Function

After fixing the API key, redeploy:

```bash
# Deploy the updated function
supabase functions deploy repair-diagnostic

# Verify deployment
supabase functions list
```

---

## Step 5: Test the Connection

### Browser Console Test:
1. Open your app
2. Press F12 to open DevTools
3. Go to Console tab
4. Run:

```javascript
const { data, error } = await window.supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test connection' }
});
console.log('Response:', data, 'Error:', error);
```

### Expected Response:
```json
{
  "success": true,
  "answer": "...",
  "partImages": []
}
```

---

## Common Issues & Solutions

### Issue 1: "No images available"
**Cause**: OpenAI responds but image fetching fails
**Solution**: 
- Check Google Custom Search API credentials
- Verify GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in Supabase secrets
- Images are optional - text responses should still work

### Issue 2: Slow responses
**Cause**: OpenAI API taking time to respond
**Solution**: 
- Normal for complex questions
- Timeout is set to 50 seconds
- Try simpler questions first

### Issue 3: Intermittent failures
**Cause**: Network issues or OpenAI rate limits
**Solution**:
- The app automatically retries 3 times
- Wait 30 seconds between attempts
- Check OpenAI status: https://status.openai.com/

---

## Quick Fix Commands

```bash
# 1. Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your-key-here

# 2. Redeploy function
supabase functions deploy repair-diagnostic

# 3. Check logs
supabase functions logs repair-diagnostic --tail

# 4. Test function
curl -X POST "https://YOUR-PROJECT.supabase.co/functions/v1/repair-diagnostic" \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'
```

---

## Still Having Issues?

### Check Browser Console:
1. Press F12
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests

### Check Edge Function Logs:
1. Supabase Dashboard → Edge Functions → repair-diagnostic
2. Look for detailed error messages
3. Note the timestamp of errors

### Verify Environment:
- ✅ OPENAI_API_KEY is set in Supabase secrets
- ✅ Edge function is deployed
- ✅ OpenAI account has credits
- ✅ No rate limits active

---

## Enhanced Error Messages

The edge function now provides specific error messages:

- **401 Error**: "OpenAI API key is invalid or not configured"
- **429 Error**: "OpenAI API rate limit exceeded"
- **500/503 Error**: "OpenAI service is temporarily unavailable"
- **Other Errors**: Detailed error message from OpenAI

Check the browser console and edge function logs for these specific messages.
