# BLANK SCREEN FIX - Quick Diagnostic Steps

## Your screen is blank? Follow these steps:

### Step 1: Check Browser Console (MOST IMPORTANT)
1. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Click the "Console" tab
3. Look for RED error messages
4. Take a screenshot and share what you see

### Step 2: Hard Refresh (Clear Cache)
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

### Step 3: Clear Browser Cache Completely
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page

### Step 4: Check if Server is Running
- Open a new tab and go to: `http://localhost:5173/test.html`
- If you see "Server is Working", the server is fine
- If you see nothing, restart your dev server: `npm run dev`

### Step 5: Verify Environment Variables
Check if `.env` file exists with:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Step 6: Reinstall Dependencies
```bash
rm -rf node_modules
npm install
npm run dev
```

## Common Causes:

1. **JavaScript Error**: Check console for errors
2. **Build Cache**: Hard refresh usually fixes this
3. **Missing Environment Variables**: Check .env file
4. **Port Conflict**: Try a different port
5. **Component Error**: One component might be crashing

## Quick Test:
Visit: `http://localhost:5173/` - You should see the homepage with Hero section

## Still Blank?
Share the console errors and I'll help you fix it!
