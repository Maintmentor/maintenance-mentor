# 🔧 URGENT FIX: No Photos Available

## The Problem
Your app shows "No images available" because the Google Custom Search API credentials are missing or not working.

## IMMEDIATE SOLUTION (Choose One)

### ✅ Option A: Quick Fix - Enable AI Images (5 minutes)
Use OpenAI DALL-E to generate realistic product photos.

**Your OpenAI API key is ALREADY configured!**

1. **Update the edge function:**
   - Copy the code from `supabase/functions/repair-diagnostic/index-with-ai-fallback.ts`
   - Paste into Supabase Dashboard → Edge Functions → repair-diagnostic
   - Click "Deploy"

2. **Test immediately:**
   - Ask in chat: "What does a toilet fill valve look like?"
   - You'll see an AI-generated photo instantly

**Result:** Always shows images, no setup needed!

---

### 🌐 Option B: Real Product Photos (15 minutes)
Get actual photos from manufacturer websites and retailers.

#### Step 1: Get Google API Key
1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "Custom Search API":
   - Click "Enable APIs and Services"
   - Search for "Custom Search API"
   - Click "Enable"
4. Create credentials:
   - Go to "Credentials" tab
   - Click "Create Credentials" → "API Key"
   - Copy the API key

#### Step 2: Create Custom Search Engine
1. Go to: https://programmablesearchengine.google.com/
2. Click "Add" or "Create"
3. Settings:
   - Name: "Repair Parts Search"
   - What to search: "Search the entire web"
   - Click "Create"
4. Copy the "Search Engine ID" (looks like: 1234567890abc:xyz)

#### Step 3: Add to Supabase
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions
3. Click "Manage secrets"
4. Add two secrets:
   ```
   GOOGLE_API_KEY = your_api_key_here
   GOOGLE_CSE_ID = your_search_engine_id_here
   ```
5. Click "Save"

#### Step 4: Redeploy Function
The function will automatically detect Google credentials and use real photos!

---

## Testing

### Test AI Images (Option A)
```
Chat: "Show me a capacitor"
Expected: AI-generated photo of a capacitor
Console: "🎨 Using AI-generated images"
```

### Test Real Photos (Option B)
```
Chat: "Show me a Fluidmaster fill valve"
Expected: Real product photo from Google
Console: "🌐 Using real product photos from Google"
```

---

## Troubleshooting

### Still seeing "No images available"?

1. **Check Supabase logs:**
   - Dashboard → Edge Functions → repair-diagnostic → Logs
   - Look for error messages

2. **Verify API keys:**
   ```bash
   # In Supabase Dashboard → Edge Functions → Secrets
   OPENAI_API_KEY = sk-... (should exist)
   GOOGLE_API_KEY = AIza... (optional, for real photos)
   GOOGLE_CSE_ID = abc123... (optional, for real photos)
   ```

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Check console:**
   - Open browser DevTools (F12)
   - Look for error messages in Console tab

### Common Issues

**"OpenAI API key not configured"**
- Your OPENAI_API_KEY secret is missing
- Add it in Supabase Dashboard → Edge Functions → Secrets

**"Google API credentials not configured"**
- This is OK if using Option A (AI images)
- For Option B, add GOOGLE_API_KEY and GOOGLE_CSE_ID

**Images load slowly**
- First image generation takes 5-10 seconds
- This is normal for DALL-E 3

---

## What You'll Get

### With AI Images (Option A)
✅ Always works, no external dependencies
✅ Professional-looking product photos
✅ Fast setup (already configured)
❌ Generated images, not real products

### With Real Photos (Option B)
✅ Actual product photos from web
✅ Shows real parts from manufacturers
✅ More accurate for identification
❌ Requires Google API setup
❌ May not find images for obscure parts

---

## Recommended Approach

**Use BOTH!**
1. Set up Google API (Option B) for real photos
2. Keep AI fallback enabled (Option A)
3. System automatically uses real photos when available
4. Falls back to AI images when Google doesn't find anything

This gives you the best of both worlds! ✨
