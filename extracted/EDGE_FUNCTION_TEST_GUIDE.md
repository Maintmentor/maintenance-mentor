# Edge Function Testing Guide

## Overview
This guide explains how to test the `repair-diagnostic` edge function with comprehensive error logging and diagnostics.

## What Was Added

### 1. Enhanced Error Logging in Chat Interface
**File:** `src/components/chat/EnhancedChatInterface.tsx`

Added detailed console logging with emojis for easy identification:
- 🚀 Function invocation start
- 📤 Request payload details
- ⏱️ Execution duration
- 📥 Response data
- ✅ Success indicators
- ❌ Error details with full context
- 💥 Unexpected errors with stack traces
- 💬 AI message creation details
- ⚠️ Database save errors

### 2. Dedicated Test Page
**File:** `src/pages/EdgeFunctionTest.tsx`
**Route:** `/edge-function-test`

Features:
- Simple UI to test edge function calls
- Image upload capability
- Real-time execution logs
- Detailed error display
- Success/failure indicators
- Response visualization

## How to Test

### Method 1: Use the Test Page
1. Navigate to `/edge-function-test` in your browser
2. Enter a test question (default: "What does a toilet fill valve look like?")
3. Optionally upload an image
4. Click "Run Test"
5. View detailed logs in real-time
6. See results or errors displayed

### Method 2: Use the Chat Interface
1. Go to `/dashboard` and open the AI chat
2. Open browser console (F12)
3. Type a question or upload an image
4. Send the message
5. Watch the console for detailed logs:
   ```
   🚀 Invoking repair-diagnostic function...
   📤 Request payload: {...}
   ⏱️ Function completed in 2345ms
   📥 Function response: {...}
   ✅ Data received: {...}
   💬 AI message created: {...}
   ```

## What to Look For

### Success Indicators
- ✅ Function completes without errors
- ✅ `data.success === true`
- ✅ `data.answer` contains AI response
- ✅ `data.partImages` contains product images (if applicable)
- ✅ Execution time under 60 seconds

### Common Errors

#### 1. Connection Timeout
```
Error: Request timeout - please try again
```
**Solution:** Edge function took too long. Check:
- OpenAI API response time
- Network connectivity
- Function timeout settings (currently 60s)

#### 2. OpenAI API Key Missing
```
Error: OpenAI API key not configured
```
**Solution:** Set `OPENAI_API_KEY` in Supabase edge function secrets

#### 3. Invalid Request Body
```
Error: Invalid request body
```
**Solution:** Check request payload format

#### 4. Supabase Connection Error
```
Error: Unable to connect to AI service
```
**Solution:** 
- Check Supabase URL and anon key in `.env`
- Verify edge function is deployed
- Check function logs in Supabase dashboard

## Checking Edge Function Logs

### In Supabase Dashboard
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on `repair-diagnostic`
4. View "Logs" tab
5. Look for:
   - Function invocations
   - Error messages
   - Execution times
   - Console.log outputs

### In Browser Console
All requests now log detailed information:
- Request payload
- Response data
- Error details with full context
- Execution timing

## Testing Checklist

- [ ] Test without image
- [ ] Test with uploaded image
- [ ] Test with invalid question
- [ ] Test with very long question
- [ ] Check console logs for errors
- [ ] Verify AI response quality
- [ ] Verify part images are fetched
- [ ] Check execution time
- [ ] Test error handling
- [ ] Verify database saves messages

## Debugging Tips

1. **Check Network Tab:** Open DevTools → Network → Filter by "repair-diagnostic"
2. **Check Console:** Look for emoji-prefixed logs (🚀, ✅, ❌, etc.)
3. **Check Supabase Logs:** Dashboard → Edge Functions → repair-diagnostic → Logs
4. **Test Edge Function Directly:** Use `/edge-function-test` page
5. **Verify Environment Variables:** Check `.env` file has correct Supabase credentials

## Environment Variables Required

```env
VITE_SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uTh05YYYItYyXOduWlzlLw_vrzOgRHh
```

## Next Steps

If edge function works:
- ✅ AI responses are generated
- ✅ Part images are fetched
- ✅ Messages are saved to database
- ✅ Error handling works correctly

If edge function fails:
1. Check error logs in console
2. Check Supabase edge function logs
3. Verify environment variables
4. Check OpenAI API key
5. Test with `/edge-function-test` page
6. Review error details in toast notifications
