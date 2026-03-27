# AI Agent Troubleshooting Guide

## Common Issues and Solutions

### 1. Check OpenAI API Key Configuration

The most common issue is that the OpenAI API key is not properly configured in Supabase.

**Verify the key is set:**
```bash
# List all secrets
supabase secrets list

# Set the OpenAI API key if missing
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

**Important:** The API key must be set in Supabase secrets, NOT just in your `.env` file. The edge function cannot access local `.env` variables.

### 2. Deploy/Redeploy the Edge Function

If the function isn't deployed or is outdated:

```bash
# Deploy the repair-diagnostic function
supabase functions deploy repair-diagnostic

# Or deploy all functions
supabase functions deploy
```

### 3. Check Function Logs

View real-time logs to see what's happening:

```bash
# View logs for the repair-diagnostic function
supabase functions logs repair-diagnostic
```

### 4. Verify Environment Variables

Ensure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Test the Function Directly

Test if the function is working using curl:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I fix a leaky faucet?"}'
```

### 6. Common Error Messages and Solutions

#### "Failed to send a request"
- **Cause:** Edge function not deployed or not accessible
- **Solution:** Deploy the function using `supabase functions deploy repair-diagnostic`

#### "OpenAI API key not configured"
- **Cause:** OPENAI_API_KEY not set in Supabase secrets
- **Solution:** Set the key using `supabase secrets set OPENAI_API_KEY=sk-...`

#### "Request timeout"
- **Cause:** OpenAI taking too long to respond
- **Solution:** Try with shorter questions or simpler queries

#### "No response from edge function"
- **Cause:** Function crashed or not returning proper response
- **Solution:** Check logs with `supabase functions logs repair-diagnostic`

### 7. Quick Fix Script

Run these commands in order:

```bash
# 1. Set OpenAI API key in Supabase
supabase secrets set OPENAI_API_KEY=your-key-here

# 2. Deploy the function
supabase functions deploy repair-diagnostic

# 3. Test the function
curl -X POST https://your-project.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'

# 4. Check logs if still not working
supabase functions logs repair-diagnostic
```

### 8. Browser Console Debugging

Open browser DevTools (F12) and check:
1. Network tab - Look for failed requests to `repair-diagnostic`
2. Console tab - Check for error messages
3. Response tab - See what the function is returning

### 9. Verify Supabase Connection

Test if Supabase is connected properly:

```javascript
// Run this in browser console
const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test' }
});
console.log('Response:', data);
console.log('Error:', error);
```

### 10. Alternative: Use Direct OpenAI Integration

If edge functions continue to fail, you can temporarily use direct OpenAI integration:

1. Create a new API route in your backend
2. Call OpenAI directly from your server
3. Update the chat interface to use your backend endpoint

## Still Not Working?

If the AI agent still isn't working after trying these steps:

1. **Check OpenAI Account:** Ensure your OpenAI account has credits and the API key is valid
2. **Check Supabase Status:** Visit status.supabase.com for any ongoing issues
3. **Simplify the Test:** Try with a very simple question like "Hello"
4. **Check CORS:** Ensure CORS headers are properly configured in the edge function
5. **Review Recent Changes:** Check if any recent deployments broke the function

## Contact Support

If none of these solutions work:
- Check Supabase documentation: https://supabase.com/docs/guides/functions
- OpenAI API documentation: https://platform.openai.com/docs
- File an issue with detailed error logs and steps to reproduce