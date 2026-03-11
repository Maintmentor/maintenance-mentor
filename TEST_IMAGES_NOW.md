# 🧪 Test Image Generation Right Now

## Quick Test (2 minutes)

### Step 1: Check Current Setup
Open your browser console (F12) and run this in your app:

```javascript
// Test if OpenAI key is working
fetch('https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
  },
  body: JSON.stringify({
    question: 'What does a toilet fill valve look like?'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
```

### Step 2: What to Look For

**✅ SUCCESS - You'll see:**
```javascript
{
  success: true,
  answer: "...",
  generatedImage: "https://...",  // AI-generated image URL
  partImages: []  // Empty if Google not configured
}
```

**❌ FAILURE - You'll see:**
```javascript
{
  success: false,
  error: "OpenAI API key not configured"
}
```

---

## Fix Based on Results

### If you see "OpenAI API key not configured"

1. Go to Supabase Dashboard
2. Project Settings → Edge Functions
3. Click "Manage secrets"
4. Add:
   ```
   OPENAI_API_KEY = sk-proj-...your-key...
   ```
5. Redeploy the function

### If you see success but no images

The function is working but needs the updated code!

**Quick Fix:**
1. Go to Supabase Dashboard
2. Edge Functions → repair-diagnostic
3. Replace ALL code with content from:
   `supabase/functions/repair-diagnostic/index-with-ai-fallback.ts`
4. Click "Deploy"
5. Test again in your app

---

## Manual Deployment (If needed)

If you have Supabase CLI installed:

```bash
# Deploy the updated function
supabase functions deploy repair-diagnostic

# Test it
supabase functions invoke repair-diagnostic \
  --body '{"question":"What does a capacitor look like?"}'
```

---

## Expected Behavior After Fix

### In Chat Interface:
1. User: "Show me a toilet fill valve"
2. AI: *Generates response with image*
3. Image appears below the text
4. Console shows: "🎨 AI image generated successfully"

### Console Logs:
```
🔍 Found 1 image requests
🎨 Generating AI image for: toilet fill valve
✅ AI image generated successfully
✅ Images: 0 real, 1 AI
```

---

## Still Not Working?

### Check These:

1. **Supabase Function Logs:**
   - Dashboard → Edge Functions → repair-diagnostic → Logs
   - Look for errors

2. **Browser Console:**
   - F12 → Console tab
   - Look for failed requests

3. **Network Tab:**
   - F12 → Network tab
   - Filter by "repair-diagnostic"
   - Check response

### Common Issues:

**"Function not found"**
- Function isn't deployed
- Deploy from dashboard or CLI

**"Timeout"**
- DALL-E takes 5-10 seconds
- This is normal, just wait

**"Rate limit exceeded"**
- OpenAI API quota reached
- Check your OpenAI dashboard

**"Invalid API key"**
- Key is wrong or expired
- Generate new key from OpenAI

---

## Get Your OpenAI API Key

If you don't have one:

1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)
4. Add to Supabase secrets as `OPENAI_API_KEY`

**Note:** You need billing enabled on OpenAI account for DALL-E 3.
Cost: ~$0.04 per image (very cheap!)

---

## Success Checklist

- [ ] OpenAI API key is set in Supabase
- [ ] Function code is updated with AI fallback
- [ ] Function is deployed
- [ ] Test query returns image URL
- [ ] Image displays in chat interface
- [ ] Console shows success messages

Once all checked, your images will work! ✨
