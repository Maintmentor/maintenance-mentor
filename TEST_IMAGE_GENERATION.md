# 🧪 Test Image Generation

## After Deployment

Once you've deployed the edge function, test it with these questions:

### Test Questions (Copy & Paste)

1. **"What does a capacitor look like?"**
   - Should generate image of HVAC capacitor
   - Cylindrical, metallic, with terminals

2. **"Show me a toilet fill valve"**
   - Should generate image of fill valve
   - Tall vertical component inside tank

3. **"Can you show me what an anode rod looks like?"**
   - Should generate image of water heater anode rod
   - Long metal rod with hex head

4. **"What does a furnace filter look like?"**
   - Should generate image of HVAC filter
   - Rectangular, pleated material

5. **"Show me a water heater element"**
   - Should generate image of heating element
   - Curved metal rod with mounting flange

6. **"What does a garbage disposal look like?"**
   - Should generate image of disposal unit
   - Cylindrical unit under sink

## What to Look For

### ✅ Success Indicators
- Image appears below AI response text
- Image is professional product photo
- Image is clickable to open full size
- Image loads within 5-10 seconds
- No error messages in console

### ❌ Failure Indicators
- No image appears
- Console shows errors
- "Could not generate image" message appears
- Request takes longer than 30 seconds
- 500 error in network tab

## Browser Console Check

Open DevTools (F12) → Console and look for:

**Good Signs:**
```
✅ Image generated successfully: https://oaidalleapiprodscus...
```

**Bad Signs:**
```
❌ DALL-E API error: 429 Rate limit exceeded
❌ Photo generation error: ...
OpenAI API key not configured
```

## Network Tab Check

1. Open DevTools (F12) → Network
2. Ask a test question
3. Find `repair-diagnostic` request
4. Check Response tab for:

```json
{
  "success": true,
  "answer": "...",
  "generatedImage": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "stepImages": [],
  "videos": []
}
```

## Common Issues

### Issue: No `generatedImage` in response
**Cause:** AI didn't include `GENERATE_IMAGE:` in response
**Fix:** Ask more explicitly: "Show me what X looks like"

### Issue: `generatedImage` is null
**Cause:** DALL-E API call failed
**Fix:** Check edge function logs for error details

### Issue: Rate limit error
**Cause:** Too many requests to DALL-E
**Fix:** Wait 60 seconds between tests

### Issue: Image URL but no display
**Cause:** Frontend not rendering image
**Fix:** Check ChatInterface.tsx for rendering logic

## Edge Function Logs

Monitor in real-time:
```bash
supabase functions logs repair-diagnostic --tail
```

Look for:
- ✅ Image generated successfully
- ❌ DALL-E API error
- ❌ Photo generation error

## Quick Verification Script

Run in browser console on your app:
```javascript
// Test the edge function directly
const testImageGeneration = async () => {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/repair-diagnostic',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_ANON_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: 'Show me what a capacitor looks like'
      })
    }
  );
  
  const data = await response.json();
  console.log('Response:', data);
  
  if (data.generatedImage) {
    console.log('✅ Image generated!');
    console.log('URL:', data.generatedImage);
  } else {
    console.log('❌ No image generated');
  }
};

testImageGeneration();
```

## Success Criteria

All 6 test questions should:
- ✅ Return a response within 10 seconds
- ✅ Include `generatedImage` URL in response
- ✅ Display image in chat interface
- ✅ Image is relevant to the question
- ✅ No errors in console or logs

If all tests pass, image generation is working correctly! 🎉
