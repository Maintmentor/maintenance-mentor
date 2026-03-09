# 🧪 Test AI Assistant Connection

## Quick Connection Test

Your app is configured to connect to:
```
https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic
```

## Method 1: Browser Console Test (Fastest)

1. Open your app in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Paste and run this code:

```javascript
// Replace YOUR_ANON_KEY with your actual key from .env
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZGxjbHpqZmloYnBoZWhoaWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDIxNTYsImV4cCI6MjA3MzYxODE1Nn0.gjd1_Q4G_LfKg_pZzQcUYQoTeSvrvL618uh_plQbQok';

fetch('https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`
  },
  body: JSON.stringify({
    question: 'Test connection',
    images: []
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ SUCCESS! Response:', data);
})
.catch(error => {
  console.error('❌ ERROR:', error);
});
```

### Expected Results:

**✅ Success (Function Working)**:
```
Status: 200
✅ SUCCESS! Response: {
  success: true,
  answer: "...",
  partImages: [],
  generatedImage: null
}
```

**❌ Error 404 (Function Not Deployed)**:
```
Status: 404
❌ ERROR: Function not found
```
**Fix**: Deploy the function with `supabase functions deploy repair-diagnostic`

**❌ Error 401 (Invalid Key)**:
```
Status: 401
❌ ERROR: Unauthorized
```
**Fix**: Check your VITE_SUPABASE_ANON_KEY in .env file

**❌ Error 500 (Missing OpenAI Key)**:
```
Status: 500
❌ ERROR: Internal server error
```
**Fix**: Set OPENAI_API_KEY secret in Supabase Dashboard

## Method 2: Command Line Test

```bash
# Test if function exists
curl -I https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic

# Full test with data
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"question":"test","images":[]}'
```

## Method 3: In-App Diagnostic

1. Go to your app
2. Navigate to `/admin` page
3. Find "AI Connection Diagnostic" card
4. Click "Run Diagnostic Test"
5. Review detailed results

## Method 4: Check Function Status

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref kudlclzjfihbphehhiii

# List deployed functions
supabase functions list

# View function logs
supabase functions logs repair-diagnostic
```

## Common Issues & Fixes

### Issue: "Failed to send a request to the Edge Function"

**Cause**: Function not deployed or not accessible

**Fix**:
```bash
supabase functions deploy repair-diagnostic
```

### Issue: "OpenAI API key not configured"

**Cause**: Missing OPENAI_API_KEY secret

**Fix**:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

Or in Dashboard:
1. Go to https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/functions
2. Click "Secrets"
3. Add: OPENAI_API_KEY = your-key

### Issue: CORS Error

**Cause**: Browser blocking cross-origin request

**Fix**: This should not happen as Supabase handles CORS. If it does:
- Check if Supabase project is active
- Verify URL is correct in .env
- Try from different browser

## Verification Checklist

Run through this checklist:

- [ ] `.env` file has correct VITE_SUPABASE_URL
- [ ] `.env` file has valid VITE_SUPABASE_ANON_KEY
- [ ] Edge function is deployed (`supabase functions list`)
- [ ] OPENAI_API_KEY secret is set in Supabase
- [ ] Dev server restarted after .env changes (`npm run dev`)
- [ ] Browser console shows no errors
- [ ] Function returns 200 status when tested

## Success Indicators

You'll know it's working when:

1. ✅ Browser console test returns status 200
2. ✅ Response has `success: true`
3. ✅ AI Assistant in app responds to questions
4. ✅ No error banners appear in app
5. ✅ Function logs show successful requests

## Next Steps

Once connection is working:

1. Test AI features in the app
2. Upload an image and ask for repair advice
3. Check that responses are generated
4. Verify images are displayed correctly

## Need More Help?

See detailed troubleshooting: [FIX_AI_CONNECTION_ERROR.md](./FIX_AI_CONNECTION_ERROR.md)

---

**Target URL**: https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic  
**Last Updated**: October 27, 2025
