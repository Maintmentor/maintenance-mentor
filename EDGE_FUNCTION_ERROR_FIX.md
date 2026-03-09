# Fix: "Failed to send a request to the Edge Function"

## Quick Fix Steps

### 1. Check Edge Function Deployment
```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy repair-diagnostic
```

### 2. Verify Environment Variables in Supabase Dashboard
Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Required secrets:
- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set by Supabase

### 3. Check .env File
Ensure your local `.env` has:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Test Edge Function Directly
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'
```

## Common Causes

1. **Function not deployed** → Deploy with command above
2. **Wrong Supabase URL** → Check .env matches dashboard
3. **Missing API keys** → Add OPENAI_API_KEY to secrets
4. **CORS issues** → Function already has CORS headers
5. **Network timeout** → Function has 50s timeout built-in

## Still Not Working?

Check browser console for exact error message and verify:
- Supabase project is active
- Edge Functions are enabled on your plan
- No firewall blocking requests
