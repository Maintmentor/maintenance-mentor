# Fix "No Images" Issue - Get Real Product Photos Working

## The Problem
You're seeing "no photos available" because the Google Custom Search API is not configured.

## Solution: Set Up Google Custom Search API (5 minutes)

### Step 1: Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Library**
4. Search for "Custom Search API"
5. Click **Enable**
6. Go to **APIs & Services** → **Credentials**
7. Click **Create Credentials** → **API Key**
8. Copy your API key (starts with `AIza...`)

### Step 2: Create Custom Search Engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **Add** or **Get Started**
3. Configure:
   - **Sites to search**: `*.com` (search entire web)
   - **Name**: "Product Image Search"
   - Enable **Image Search**
   - Enable **Search the entire web**
4. Click **Create**
5. Copy your **Search Engine ID** (looks like: `a1b2c3d4e5f6g7h8i`)

### Step 3: Add to Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Add these two variables:

```
GOOGLE_API_KEY = AIza... (your API key from Step 1)
GOOGLE_CSE_ID = a1b2c3... (your Search Engine ID from Step 2)
```

5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### Step 4: Test It

1. Wait for deployment to complete (2-3 minutes)
2. Open your app
3. Ask the AI assistant about a repair (e.g., "My faucet is leaking")
4. You should now see real product photos!

## Verification

The edge function will now:
- ✅ Search Google Images for real product photos
- ✅ Return actual manufacturer images
- ✅ Show relevant parts and products
- ✅ Display "No images found" only if truly none exist

## Troubleshooting

### Still seeing "no images"?

1. **Check environment variables are set**:
   - Go to Netlify → Site configuration → Environment variables
   - Verify both `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` exist

2. **Check API is enabled**:
   - Go to Google Cloud Console
   - Verify "Custom Search API" is enabled

3. **Check Search Engine settings**:
   - Go to Programmable Search Engine dashboard
   - Verify "Image search" is ON
   - Verify "Search the entire web" is ON

4. **Redeploy**:
   - Netlify → Deploys → Trigger deploy

### API Quota Issues?

Google Custom Search API free tier:
- 100 queries per day (free)
- Need more? Enable billing for $5 per 1000 queries

## Cost

- **Free tier**: 100 image searches per day
- **Paid**: $5 per 1,000 additional queries
- For most users, free tier is sufficient

## Next Steps

Once configured, your app will show real product photos from:
- Manufacturer websites
- Retailer product pages
- Professional product photography
- Technical documentation

No more AI-generated images - only real, accurate product photos!
