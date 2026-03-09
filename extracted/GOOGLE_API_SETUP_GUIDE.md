# Google Custom Search API Setup - Detailed Guide

## Overview
This guide will help you set up Google Custom Search API to display real product photos in your app.

**Time needed**: 5-10 minutes  
**Cost**: Free (100 searches/day)

---

## Part 1: Google Cloud Console Setup

### 1. Create/Select Project

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click "New Project"
   - Project name: "Maintenance Mentor" (or any name)
   - Click "Create"
5. Wait for project creation (30 seconds)

### 2. Enable Custom Search API

1. In the left sidebar, click **APIs & Services** → **Library**
2. In the search box, type: "Custom Search API"
3. Click on "Custom Search API" from results
4. Click the blue **Enable** button
5. Wait for API to be enabled (10 seconds)

### 3. Create API Key

1. Click **APIs & Services** → **Credentials** (left sidebar)
2. Click **+ Create Credentials** (top)
3. Select **API Key**
4. A popup shows your API key (starts with `AIza...`)
5. Click the copy icon to copy it
6. Save it somewhere safe (you'll need it later)

**Your API Key looks like**:
```
AIzaSyC1234567890abcdefghijklmnopqrstuv
```

### 4. Restrict API Key (Optional but Recommended)

1. Click **Edit API Key** in the popup
2. Under "API restrictions":
   - Select "Restrict key"
   - Check only "Custom Search API"
3. Click **Save**

---

## Part 2: Programmable Search Engine Setup

### 1. Create Search Engine

1. Visit: https://programmablesearchengine.google.com/
2. Click **Get Started** or **Add**
3. Fill in the form:

**Search engine name**:
```
Product Image Search
```

**What to search**:
- Select "Search the entire web"

**Image search**:
- Toggle ON (very important!)

4. Click **Create**

### 2. Get Search Engine ID

1. After creation, you'll see your search engine
2. Click on it to open settings
3. Look for "Search engine ID" or "Engine ID"
4. Copy the ID (looks like: `a1b2c3d4e5f6g7h8i`)

**Your Search Engine ID looks like**:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p
```

### 3. Configure Search Settings

1. In the search engine settings page:
2. Under "Setup" → "Basics":
   - Ensure "Image search" is ON
   - Ensure "Search the entire web" is selected
3. Under "Setup" → "Advanced":
   - SafeSearch: ON (recommended)
4. Click **Update** if you made changes

---

## Part 3: Add to Netlify

### 1. Open Netlify Dashboard

1. Go to: https://app.netlify.com/
2. Select your site (maintenancementor.io)
3. Click **Site configuration** (left sidebar)
4. Click **Environment variables**

### 2. Add Environment Variables

Click **Add a variable** and add these TWO variables:

**Variable 1**:
```
Key: GOOGLE_API_KEY
Value: AIzaSyC1234... (paste your API key from Part 1)
```

**Variable 2**:
```
Key: GOOGLE_CSE_ID
Value: a1b2c3d4e5f6... (paste your Search Engine ID from Part 2)
```

### 3. Deploy

1. Click **Save**
2. Go to **Deploys** (left sidebar)
3. Click **Trigger deploy** → **Deploy site**
4. Wait 2-3 minutes for deployment

---

## Part 4: Test

1. Open your app: https://maintenancementor.io
2. Click on the chat/AI assistant
3. Ask about a repair, for example:
   - "My kitchen faucet is leaking"
   - "Water heater not heating"
   - "Dishwasher won't drain"
4. You should now see **real product photos**!

---

## Troubleshooting

### "No photos available" still showing?

**Check 1**: Verify environment variables
- Netlify → Site configuration → Environment variables
- Both variables should be there

**Check 2**: Verify API is enabled
- Google Cloud Console → APIs & Services → Dashboard
- "Custom Search API" should show as enabled

**Check 3**: Verify Search Engine settings
- Programmable Search Engine dashboard
- Image search should be ON
- Search entire web should be selected

**Check 4**: Redeploy
- Netlify → Deploys → Trigger deploy

### API Key not working?

- Make sure you copied the entire key (starts with `AIza`)
- Check there are no extra spaces
- Try creating a new API key

### Search Engine ID not working?

- Make sure you copied the correct ID
- It should be alphanumeric, no spaces
- Try refreshing the Programmable Search Engine page

---

## Costs & Limits

**Free Tier**:
- 100 searches per day
- Perfect for testing and small usage

**Paid Tier** (if needed):
- $5 per 1,000 additional queries
- Enable billing in Google Cloud Console

---

## Success! 🎉

Once configured, your app will display:
- ✅ Real manufacturer product photos
- ✅ Actual part images from retailers
- ✅ Professional product photography
- ✅ Accurate visual references

No more AI-generated images - only real, accurate photos!
