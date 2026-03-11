# Quick Fix for Blank Screen Issue

## Immediate Steps to Diagnose

### 1. Test Basic HTML (No React)
Visit: `http://localhost:5173/test-basic.html`
- If you see a colorful page saying "HTML is Working!" → Web server is OK, issue is with React
- If blank → Web server or browser issue

### 2. Current State
- Index.tsx is now using `SimpleAppLayout` - a minimal test component
- This removes all complex components to isolate the issue

### 3. Check Browser Console
Press F12 and look for:
- Red error messages
- Failed network requests
- Module not found errors

## Common Fixes

### Fix 1: Clear Everything and Restart
```bash
# Stop the dev server (Ctrl+C)
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Fix 2: Clear Browser Cache
- Chrome: Ctrl+Shift+Delete → Clear browsing data
- Or open in Incognito/Private window

### Fix 3: Check for Port Conflicts
```bash
# Kill any processes on port 5173
npx kill-port 5173
npm run dev
```

### Fix 4: Verify Build
```bash
npm run build
# If build fails, there's a code issue
# If build succeeds, try:
npm run preview
```

## What You Should See

### If SimpleAppLayout Works:
- Green checkmark saying "✅ React is Working!"
- This means the issue was in AppLayout components

### If Still Blank:
1. Check if `http://localhost:5173/test-basic.html` works
2. Open browser console (F12) and report any errors
3. Try a different browser
4. Check if antivirus/firewall is blocking

## Next Steps After Fix

Once you see the SimpleAppLayout working:
1. Edit `src/pages/Index.tsx`
2. Change `SimpleAppLayout` back to `AppLayout`
3. If blank again, the issue is in one of the AppLayout components

## Emergency Reset

If nothing works, create a fresh minimal app:
```bash
# In src/pages/Index.tsx, replace everything with:
export default function Index() {
  return <div style={{padding: '50px', fontSize: '30px'}}>
    App is running! 🎉
  </div>;
}
```

## Report Back

Let me know:
1. Can you see `/test-basic.html`?
2. Can you see SimpleAppLayout?
3. Any console errors?
4. What browser are you using?