# Quick Deploy Guide - Image Display Fix

## What Was Fixed
The AI assistant wasn't showing images because it didn't know how to request them. The system prompt has been updated to teach the AI when and how to generate images.

## Deploy Now

```bash
# 1. Deploy the updated edge function
supabase functions deploy repair-diagnostic

# 2. Verify it deployed successfully
supabase functions list
# Look for "repair-diagnostic" with status "ACTIVE"

# 3. Check that OpenAI API key is set
supabase secrets list
# Verify OPENAI_API_KEY is present
```

## Test Immediately

Open your app and try these questions:

1. **"Show me a toilet fill valve"**
   - Should generate a professional product photo
   - Image appears below AI's response
   - Labeled as "AI Generated Photograph"

2. **"What does a faucet cartridge look like?"**
   - Should generate detailed product image
   - Includes description from AI

3. **"Display a thermostat"**
   - Should show modern thermostat image
   - High-quality professional photo

## What to Expect

### Before Fix:
- ❌ User asks "show me X"
- ❌ AI responds with text only
- ❌ No images displayed
- ❌ Message: "No images available"

### After Fix:
- ✅ User asks "show me X"
- ✅ AI responds with text + GENERATE_IMAGE tag
- ✅ Edge function generates DALL-E image
- ✅ Image uploaded to Supabase Storage
- ✅ Permanent URL displayed in chat
- ✅ Beautiful professional product photo shown

## Verification

### Check Edge Function Logs:
```bash
# In Supabase Dashboard:
# 1. Go to Edge Functions
# 2. Click "repair-diagnostic"
# 3. Click "Logs" tab
# 4. Send a test message
# 5. Look for these log entries:
```

Expected log output:
```
Calling OpenAI API...
AI Response received, length: 450
Parts to fetch: ["fill valve"]
Checking for GENERATE_IMAGE tag...
Image generation requested: modern toilet fill valve...
Calling DALL-E API...
DALL-E image generated successfully
Downloading image from DALL-E...
Uploading to Supabase Storage: user123/1234567890-abc123.png
Image uploaded successfully: https://...supabase.co/storage/v1/object/public/repair-images/...
Final response - Part images: 0, Generated image: Yes
```

## Troubleshooting

### If images still don't show:

**1. Check API Key:**
```bash
supabase secrets list
# If OPENAI_API_KEY is missing:
supabase secrets set OPENAI_API_KEY=sk-...
```

**2. Check Storage Bucket:**
- Go to Supabase Dashboard → Storage
- Verify "repair-images" bucket exists
- Check if it's set to "Public"

**3. Check Browser Console:**
- Open DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed requests

**4. Try Different Questions:**
- "Show me a water heater"
- "What does a door hinge look like?"
- "Display a light switch"

## Key Changes Made

1. **System Prompt Updated**: AI now knows to use `GENERATE_IMAGE:` tag
2. **Trigger Words Added**: "show", "see", "display", "what does it look like"
3. **Logging Enhanced**: Full visibility into image generation process
4. **Error Handling Improved**: Better error messages and fallbacks

## Success Indicators

✅ Ask "show me X" → Image appears
✅ Ask "what does X look like" → Image appears  
✅ Images are high-quality and relevant
✅ Images load in under 5 seconds
✅ Images don't expire after 1 hour
✅ Multiple images can be shown in one response

## Support

If issues persist after deployment:

1. Check `AI_IMAGE_CAPABILITY_FIX.md` for detailed troubleshooting
2. Review edge function logs in Supabase Dashboard
3. Verify OpenAI API key has credits remaining
4. Test DALL-E API directly (see troubleshooting guide)

## Deployment Complete! 🎉

Your AI assistant should now display images when users ask to see parts or components.
