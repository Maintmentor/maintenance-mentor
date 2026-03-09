# AI Assistant Troubleshooting Guide

## Problem: "I'm having trouble responding right now" Error

### What This Error Means
This error appears when the AI assistant cannot successfully process your request. It could be due to several reasons.

### How to Debug

#### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12 or right-click → Inspect)
2. Go to the **Console** tab
3. Ask a question in the AI assistant
4. Look for error messages that start with:
   - `=== CHAT REQUEST ===`
   - `=== FUNCTION ERROR ===`
   - `=== CHAT ERROR ===`

#### Step 2: Common Error Messages & Solutions

**Error: "Cannot connect to AI service"**
- **Cause**: Edge function not deployed or Supabase URL incorrect
- **Solution**: 
  1. Check `.env` file has correct `VITE_SUPABASE_URL`
  2. Verify edge function is deployed: `npm run deploy:functions`
  3. Check network connection

**Error: "OpenAI API key not configured"**
- **Cause**: OpenAI API key missing in Supabase secrets
- **Solution**: 
  1. Go to Supabase Dashboard → Edge Functions → Secrets
  2. Add `OPENAI_API_KEY` with your OpenAI API key
  3. Redeploy edge functions

**Error: "Request timeout"**
- **Cause**: Question too complex or API slow
- **Solution**: 
  1. Try a shorter, simpler question
  2. Wait a moment and try again
  3. Check if OpenAI API is experiencing issues

**Error: "No response from AI service"**
- **Cause**: Edge function not deployed
- **Solution**: Deploy the repair-diagnostic function

#### Step 3: Test Edge Function Directly

Test if the edge function is working:

```bash
curl -X POST https://YOUR-PROJECT-ID.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "test", "userId": "test"}'
```

Replace:
- `YOUR-PROJECT-ID` with your Supabase project ID
- `YOUR-ANON-KEY` with your Supabase anon key

#### Step 4: Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **repair-diagnostic**
3. Click **Logs**
4. Look for error messages

### Common Issues & Fixes

#### Issue 1: Function Returns Empty Response
**Symptoms**: "No images available for this response"
**Fix**: 
- Check if OpenAI API key is valid
- Verify OpenAI account has credits
- Check edge function logs for API errors

#### Issue 2: Images Not Loading
**Symptoms**: Response received but no images shown
**Fix**:
- Check `fetch-real-part-images` function is deployed
- Verify Google API keys are configured
- Check browser console for image loading errors

#### Issue 3: Timeout Errors
**Symptoms**: Request takes >60 seconds
**Fix**:
- Reduce image upload size
- Ask shorter questions
- Check internet connection speed

### Manual Testing Steps

1. **Test without images**:
   - Ask: "How do I fix a running toilet?"
   - Should get text response

2. **Test with images**:
   - Upload a clear photo
   - Ask: "What is this part?"
   - Should get response with part identification

3. **Test part image search**:
   - Ask: "I need a toilet flapper"
   - Should show real product images

### Getting More Help

If none of these solutions work:

1. **Check all environment variables**:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxx
   ```

2. **Verify edge function deployment**:
   ```bash
   npm run deploy:functions
   ```

3. **Check Supabase secrets**:
   - OPENAI_API_KEY
   - GOOGLE_API_KEY
   - GOOGLE_CSE_ID

4. **Review edge function logs** in Supabase Dashboard

### Enhanced Error Logging

The chat interface now logs detailed information to help debug:

- Request details (question, images, user ID)
- Function response time
- Detailed error messages
- Success/failure status
- Part images found

Check the browser console for these logs when troubleshooting.
