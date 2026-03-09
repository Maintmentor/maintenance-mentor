# Edge Function Connection Error Fix

## Problem
Getting `FunctionsFetchError: Failed to send a request to the Edge Function`

## Root Causes
1. **Network connectivity** - Can't reach Supabase servers
2. **CORS issues** - Missing or incorrect CORS headers
3. **Edge function not deployed** - Function doesn't exist or is inactive
4. **Supabase client misconfigured** - Wrong URL or anon key

## Quick Fixes Applied

### 1. Simplified Error Handling
- Removed complex retry logic that could mask real issues
- Added clear, specific error messages
- Improved timeout handling

### 2. Better Error Detection
```typescript
if (error.message?.includes('fetch')) {
  // Network/connection issue
  throw new Error('Cannot connect to AI service. Check your internet connection.');
}
```

### 3. Non-blocking Database Saves
- Database saves no longer block the main flow
- Errors in DB save won't affect user experience

## Troubleshooting Steps

### Check 1: Verify Edge Function is Deployed
```bash
# In Supabase dashboard, check Functions tab
# repair-diagnostic should show as ACTIVE
```

### Check 2: Test Direct Function Call
Open browser console and run:
```javascript
const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test', userId: 'test-user' }
});
console.log('Data:', data);
console.log('Error:', error);
```

### Check 3: Verify CORS Headers
Edge function should have:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
```

### Check 4: Verify Supabase Client Config
File: `src/lib/supabase.ts`
- URL should be: `https://kudlclzjfihbphehhiii.supabase.co`
- Anon key should be set correctly

## If Error Persists

1. **Check Network Tab** in browser DevTools
   - Look for failed requests to Supabase
   - Check response status codes

2. **Check Supabase Logs**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for errors or missing invocations

3. **Redeploy Edge Function**
   ```bash
   npm run deploy:functions
   ```

4. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Error Messages Explained

- **"Cannot connect to AI service"** = Network/fetch error
- **"Request timed out"** = Function took >60 seconds
- **"No response from AI service"** = Function returned empty data
- **"Request failed"** = Generic error from edge function
