# 🔧 Fix "No Photos Available" Issue

## Problem
Your app shows "No images available" because the image fetching system needs API credentials.

## Quick Fix Options

### Option 1: Enable AI-Generated Images (EASIEST - 2 minutes)
Your OpenAI API key is already configured! Just redeploy the updated function.

✅ **Already done** - OpenAI key is set
✅ **No additional setup needed**
✅ **Works immediately**

**What you get:** AI-generated product photos (realistic, professional-looking)

### Option 2: Enable Real Product Photos from Google (10 minutes)
Get actual product photos from the internet.

**What you get:** Real photos from manufacturer websites, retailers, etc.

---

## Setup Instructions

### For AI-Generated Images (Recommended)
The updated `repair-diagnostic` function now automatically uses OpenAI DALL-E when Google isn't configured.

**No action needed!** Just redeploy the functions.

### For Real Product Photos (Optional)
1. **Get Google API Key:**
   - Go to: https://console.cloud.google.com/
   - Create project → Enable "Custom Search API"
   - Create API key

2. **Create Custom Search Engine:**
   - Go to: https://programmablesearchengine.google.com/
   - Create new search engine
   - Search entire web
   - Copy the "Search Engine ID"

3. **Add to Supabase:**
   ```bash
   # In Supabase Dashboard → Project Settings → Edge Functions → Secrets
   GOOGLE_API_KEY=your_google_api_key_here
   GOOGLE_CSE_ID=your_search_engine_id_here
   ```

4. **Redeploy functions** (already done in this update)

---

## What Changed
- ✅ Added automatic fallback to AI images when Google isn't configured
- ✅ Better error handling and logging
- ✅ Clear console messages showing which image source is used
- ✅ No more "no images available" - always shows something

## Testing
1. Go to your app's chat
2. Ask: "What does a toilet fill valve look like?"
3. You should see an AI-generated image immediately
4. Console will show: "🎨 Using AI-generated images (Google API not configured)"
