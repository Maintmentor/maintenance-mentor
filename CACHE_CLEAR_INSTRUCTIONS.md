# Clear Cache Instructions for Homepage Fix

## Problem
www.maintenancementor.io shows sign-in page instead of public homepage with Hero section.

## Why This Happens
- Browser cache storing old version
- Service Worker cache (PWA)
- CDN cache (Netlify/Vercel)
- DNS propagation delay

## Solution 1: User Hard Refresh (Fastest)

### Windows/Linux
```
Chrome/Edge/Firefox: Ctrl + Shift + R
Alternative: Ctrl + F5
```

### Mac
```
Chrome/Firefox: Cmd + Shift + R
Safari: Cmd + Option + R
```

### Mobile
1. **iOS Safari:**
   - Settings → Safari → Clear History and Website Data
   - Close Safari completely
   - Reopen and visit site

2. **Android Chrome:**
   - Settings → Privacy → Clear browsing data
   - Select "Cached images and files"
   - Close Chrome completely
   - Reopen and visit site

## Solution 2: Clear Service Worker (Complete Fix)

### Desktop Browsers
1. Visit www.maintenancementor.io
2. Press F12 (open DevTools)
3. Go to **Application** tab
4. Click **Service Workers** in left sidebar
5. Click **Unregister** next to the service worker
6. Click **Storage** → **Clear site data**
7. Close DevTools
8. Press Ctrl+Shift+R (hard refresh)

### Mobile Browsers
1. Clear browser cache (see Mobile section above)
2. Close browser completely
3. Reopen and visit site

## Solution 3: Incognito/Private Mode (Test)
- Open www.maintenancementor.io in incognito/private mode
- This bypasses all caches
- If it works here, the issue is cache-related

## For Developers: Force Update

### Clear CDN Cache (Netlify)
```bash
# Trigger new deployment
git commit --allow-empty -m "Force cache clear"
git push

# Or in Netlify dashboard:
# Deploys → Trigger deploy → Clear cache and deploy
```

### Clear CDN Cache (Vercel)
```bash
# Redeploy
vercel --prod

# Or in Vercel dashboard:
# Deployments → ... → Redeploy
```

### Update Service Worker Version
Already done - version bumped to v7 in public/service-worker.js

## Verification Steps
1. Visit www.maintenancementor.io
2. You should see:
   - ✅ Large hero section with "Expert Home Maintenance Guidance"
   - ✅ Service categories (Pool, Water, Repair)
   - ✅ Features section
   - ✅ Pricing plans
   - ✅ Testimonials
   - ✅ Footer

3. You should NOT see:
   - ❌ Sign-in form on page load
   - ❌ Auth modal opening automatically

## Still Not Working?

### Check DNS Propagation
```bash
# Check if domain points to correct server
nslookup www.maintenancementor.io
dig www.maintenancementor.io

# Check from multiple locations
https://dnschecker.org/#A/www.maintenancementor.io
```

### Check Console for Errors
1. Press F12
2. Go to Console tab
3. Look for errors
4. Should see: "✅ PUBLIC HOMEPAGE - NO AUTH REQUIRED"

### Contact Support
If issue persists after all steps:
1. Take screenshot of what you see
2. Open DevTools Console (F12)
3. Take screenshot of console logs
4. Note your browser and OS version
5. Report to support with screenshots
