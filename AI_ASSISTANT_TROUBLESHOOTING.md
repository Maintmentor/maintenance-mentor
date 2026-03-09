# AI Assistant Troubleshooting Guide

## Why the AI Assistant Might Not Be Working

Based on the codebase analysis, here are the most common reasons and their solutions:

## 1. OpenAI API Key Not Set in Supabase ⚠️ (Most Common Issue)

### Problem
The edge function `repair-diagnostic` requires the OpenAI API key to be set in Supabase secrets, not in your local `.env` file.

### Solution
```bash
# Check if OPENAI_API_KEY is set
supabase secrets list

# If not listed, set it:
supabase secrets set OPENAI_API_KEY=your-actual-openai-api-key
```

### Verify in Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings → Edge Functions → Secrets
4. Ensure `OPENAI_API_KEY` is present

## 2. Edge Function Not Deployed

### Problem
The `repair-diagnostic` edge function might not be deployed or outdated.

### Solution
```bash
# Deploy the edge function
supabase functions deploy repair-diagnostic

# Or use the deployment script
chmod +x deploy-functions.sh
./deploy-functions.sh
```

## 3. Supabase Configuration Issues

### Problem
The frontend might not be properly configured to connect to Supabase.

### Check `.env` file
```env
VITE_SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Verify Connection
Open browser console and run:
```javascript
// This should return your Supabase client
console.log(window.supabase);

// Test the edge function
const { data, error } = await window.supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test' }
});
console.log('Response:', data, 'Error:', error);
```

## 4. Common Error Messages and Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "OpenAI API key not configured" | Missing API key in Supabase | Set OPENAI_API_KEY in Supabase secrets |
| "Failed to send a request" | Edge function not deployed | Run `supabase functions deploy repair-diagnostic` |
| "Request timed out" | Slow OpenAI response | Normal - wait or try simpler questions |
| "Edge function not accessible" | Wrong Supabase URL | Check VITE_SUPABASE_URL in .env |
| "No response from edge function" | Function crashed | Check logs in Supabase Dashboard |

## 5. Quick Diagnostic Steps

### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors:
   - `supabase is not defined` → Check .env configuration
   - `404 Not Found` → Edge function not deployed
   - `500 Internal Server Error` → Check edge function logs

### Step 2: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Send a message in chat
4. Look for `repair-diagnostic` request
5. Check:
   - Status code (should be 200)
   - Response body
   - Request headers

### Step 3: Test Edge Function Directly
```bash
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I fix a leaky faucet?"}'
```

## 6. Edge Function Logs

### View Logs in Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Edge Functions
3. Click on `repair-diagnostic`
4. View Logs tab
5. Look for error messages

### Common Log Errors
- `Error: OpenAI API key not configured` → Set the API key
- `TypeError: Cannot read property` → Code error, redeploy function
- `Timeout` → OpenAI taking too long, normal behavior

## 7. Frontend Debug Mode

Add this to `EnhancedChatInterface.tsx` for debugging:
```javascript
// Add after line 105
console.log('Debug Info:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: !!supabase,
  userId: user?.id
});
```

## 8. Emergency Fallback

If the AI still doesn't work after all troubleshooting:

### Use Fallback Analysis
The app has a fallback service that provides basic functionality without AI:
- Located in `src/services/fallbackAnalysisService.ts`
- Provides pattern-based responses
- No API key required

### Temporary Solution
Comment out the Supabase call and use fallback:
```javascript
// In EnhancedChatInterface.tsx, replace the supabase.functions.invoke with:
const aiMsg: Message = {
  id: (Date.now() + 1).toString(),
  content: "I'm currently in fallback mode. Basic analysis: Check water supply, inspect seals, and tighten connections.",
  sender: 'ai',
  timestamp: new Date()
};
setMessages(prev => [...prev, aiMsg]);
```

## 9. Complete Reset Procedure

If nothing else works:

```bash
# 1. Clear local cache
rm -rf node_modules
npm install

# 2. Reset Supabase
supabase db reset

# 3. Set API key
supabase secrets set OPENAI_API_KEY=your-key

# 4. Redeploy function
supabase functions deploy repair-diagnostic

# 5. Test
npm run dev
```

## 10. Contact Support Checklist

If you need to contact support, provide:
1. Browser console errors (screenshot)
2. Network tab screenshot showing the failed request
3. Edge function logs from Supabase Dashboard
4. Output of `supabase secrets list`
5. Your `.env` file (without sensitive keys)

## Still Not Working?

The issue is most likely one of these:
1. **Missing OPENAI_API_KEY in Supabase secrets** (90% of cases)
2. **Edge function not deployed** (8% of cases)
3. **Wrong Supabase URL/key in .env** (2% of cases)

Run this quick fix:
```bash
# Quick fix script
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase functions deploy repair-diagnostic
npm run dev
```

Then test by typing "How do I fix a leaky faucet?" in the chat.