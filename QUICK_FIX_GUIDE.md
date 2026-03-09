# ⚡ Quick Fix: AI Connection Error

## The Problem
```
⚠️ Unable to connect to AI service after 3 retry attempts.
Error: Failed to send a request to the Edge Function
```

## The Solution (5 Minutes)

### Step 1: Deploy Edge Function
```bash
# Login
supabase login

# Link project
supabase link --project-ref kudlclzjfihbphehhiii

# Deploy
supabase functions deploy repair-diagnostic
```

### Step 2: Set OpenAI Key
```bash
# Get key from: https://platform.openai.com/api-keys
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here
```

### Step 3: Test
```bash
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"question":"test","images":[]}'
```

**Expected**: `{"success":true,"answer":"..."}`

### Step 4: Refresh App
1. Restart dev server: `npm run dev`
2. Refresh browser
3. Test AI Assistant

## ✅ Done!

Your AI Assistant should now work at:
`https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic`

## Still Not Working?

### Check 1: Is Function Deployed?
```bash
supabase functions list
# Should show: repair-diagnostic
```

### Check 2: Is OpenAI Key Set?
Go to: https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/functions
- Click "Secrets"
- Verify OPENAI_API_KEY exists

### Check 3: Is .env Correct?
```bash
cat .env
# Should show:
# VITE_SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### Check 4: View Logs
```bash
supabase functions logs repair-diagnostic --tail
# Watch for errors in real-time
```

## Alternative: Use Auto-Deploy

1. Look for yellow banner in app (top-right)
2. Click "Deploy Now"
3. Wait 30 seconds
4. Refresh and test

## Get Your Keys

- **Supabase Anon Key**: https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/api
- **OpenAI API Key**: https://platform.openai.com/api-keys

## More Help

- Full guide: [FIX_AI_CONNECTION_ERROR.md](./FIX_AI_CONNECTION_ERROR.md)
- Test connection: [TEST_CONNECTION.md](./TEST_CONNECTION.md)
- Auto deployment: [EDGE_FUNCTION_AUTO_DEPLOYMENT.md](./EDGE_FUNCTION_AUTO_DEPLOYMENT.md)

---

**Your Supabase URL**: https://kudlclzjfihbphehhiii.supabase.co  
**Edge Function**: https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic
