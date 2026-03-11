# 🔍 Image Generation Troubleshooting Guide

## Why Images May Not Be Showing

### 1. **OpenAI API Key Issues**
**Symptom:** No images generate, error in console
**Check:**
```bash
supabase secrets list
```
**Fix:**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
supabase functions deploy repair-diagnostic
```

### 2. **Edge Function Not Deployed**
**Symptom:** Old behavior, no GENERATE_IMAGE prompts working
**Fix:**
```bash
supabase functions deploy repair-diagnostic
```

### 3. **DALL-E 3 Rate Limits**
**Symptom:** Works sometimes, fails other times
**Details:** DALL-E 3 has rate limits:
- Free tier: 5 images/minute
- Tier 1: 7 images/minute
- Tier 2+: Higher limits

**Fix:** Wait 60 seconds between requests or upgrade OpenAI plan

### 4. **Image URL Expiration**
**Symptom:** Images show initially but disappear later
**Details:** DALL-E URLs expire after ~1 hour
**Fix:** Implement image storage (see below)

### 5. **Browser Console Errors**
**Check:** Open DevTools → Console
**Look for:**
- `Photo generation error`
- `Failed to fetch`
- CORS errors
- 500 status codes

## Testing Image Generation

### Quick Test Commands
```javascript
// In browser console on your app:
fetch('https://your-project.supabase.co/functions/v1/repair-diagnostic', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'Show me what a capacitor looks like'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
```

### Test Questions That Should Generate Images
1. "What does a capacitor look like?"
2. "Show me a toilet fill valve"
3. "Can you show me what an anode rod looks like?"
4. "What does a water heater element look like?"
5. "Show me a furnace filter"

## Debugging Steps

### Step 1: Check Edge Function Logs
```bash
supabase functions logs repair-diagnostic --tail
```

### Step 2: Verify API Key
```bash
# List secrets
supabase secrets list

# Should show OPENAI_API_KEY
```

### Step 3: Test OpenAI API Directly
```bash
curl https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "dall-e-3",
    "prompt": "Professional product photograph of an HVAC capacitor",
    "n": 1,
    "size": "1024x1024"
  }'
```

### Step 4: Check Browser Network Tab
1. Open DevTools → Network
2. Ask a question that should generate an image
3. Find the `repair-diagnostic` request
4. Check response for `generatedImage` field

## Expected Behavior

### ✅ Working Correctly
- User asks: "Show me a capacitor"
- AI responds with text description
- Image appears below the text
- Image is clickable to open full size

### ❌ Not Working
- User asks: "Show me a capacitor"
- AI responds with text only
- No image appears
- Console shows errors

## Advanced Debugging

### Enable Verbose Logging
Add to edge function (temporarily):
```typescript
console.log('Image prompt:', imagePrompt);
console.log('Image response status:', imageResponse.status);
console.log('Generated image URL:', generatedImage);
```

### Check Response Structure
```javascript
// Expected response structure:
{
  "success": true,
  "answer": "Text response...",
  "generatedImage": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "stepImages": [],
  "videos": []
}
```

## Long-term Solutions

### Implement Image Storage
Save generated images to Supabase Storage:
```typescript
// In edge function after image generation:
const { data: uploadData } = await supabase.storage
  .from('repair-images')
  .upload(`${Date.now()}.png`, imageBlob);

const publicUrl = supabase.storage
  .from('repair-images')
  .getPublicUrl(uploadData.path).data.publicUrl;
```

### Add Image Caching
Cache common part images to reduce API calls and costs.

## Contact Support
If issues persist:
1. Check Supabase logs
2. Check OpenAI dashboard for API errors
3. Verify billing is active on OpenAI account
4. Check rate limits haven't been exceeded
