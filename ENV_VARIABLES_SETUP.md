# Environment Variables Setup for Netlify

## Required Environment Variables

Your app needs these 4 environment variables to function:

```
VITE_OPENAI_API_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
```

---

## Step-by-Step: Add Variables in Netlify

### 1. Access Environment Variables
1. Log into https://app.netlify.com
2. Select your site
3. Go to **Site settings** (top navigation)
4. Click **Environment variables** (left sidebar under "Build & deploy")

### 2. Add Each Variable

Click **"Add a variable"** and enter:

#### Variable 1: OpenAI API Key
```
Key:   VITE_OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Get from:** https://platform.openai.com/api-keys

#### Variable 2: Supabase URL
```
Key:   VITE_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
```
**Get from:** Supabase Dashboard → Settings → API → Project URL

#### Variable 3: Supabase Anon Key
```
Key:   VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxx...
```
**Get from:** Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

#### Variable 4: Stripe Publishable Key
```
Key:   VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_xxxxxxxxxxxxx (or pk_test_xxxxxxxxxxxxx for testing)
```
**Get from:** https://dashboard.stripe.com/apikeys

### 3. Save and Redeploy
1. Click **"Save"** after adding all variables
2. Go to **Deploys** tab
3. Click **"Trigger deploy"** → **"Deploy site"**
4. Wait for build to complete (~2-3 minutes)

---

## Verify Variables Are Working

After deployment, check browser console:
1. Open your site: https://maintenancementor.io
2. Press F12 (open DevTools)
3. Go to Console tab
4. Type: `import.meta.env`
5. You should see all your VITE_ variables

**Note:** Values won't show for security, but keys should be listed.

---

## Common Issues

### Issue: "Cannot read properties of undefined"
**Cause:** Environment variables not set  
**Fix:** Add all 4 variables and redeploy

### Issue: "Supabase client error"
**Cause:** Wrong Supabase URL or key  
**Fix:** Copy exact values from Supabase dashboard

### Issue: "Stripe not loading"
**Cause:** Wrong Stripe key or using secret key instead of publishable  
**Fix:** Use `pk_test_` or `pk_live_` key (NOT `sk_` secret key)

### Issue: Variables not updating
**Cause:** Old build still cached  
**Fix:** 
1. Clear site cache: Site settings → Build & deploy → Post processing → Clear cache
2. Trigger new deploy

---

## Security Notes

✅ **Safe to expose (VITE_ prefix):**
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_OPENAI_API_KEY (for client-side calls)

❌ **NEVER expose in frontend:**
- Stripe Secret Key (sk_test_ or sk_live_)
- Supabase Service Role Key
- Database passwords

These should only be in Supabase Edge Functions or backend.

---

## Quick Reference

| Variable | Where to Get It | Format |
|----------|----------------|--------|
| VITE_OPENAI_API_KEY | platform.openai.com/api-keys | sk-proj-... |
| VITE_SUPABASE_URL | Supabase → Settings → API | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | Supabase → Settings → API | eyJhbG... |
| VITE_STRIPE_PUBLISHABLE_KEY | dashboard.stripe.com/apikeys | pk_test_... or pk_live_... |

---

**After adding variables, always redeploy your site!**
