# Configuration Diagnostic Guide

## Overview
Comprehensive diagnostic tool to identify and resolve "AI service returned an error" issues.

## Access the Diagnostic Tool

### Method 1: Admin Dashboard
1. Navigate to `/admin`
2. Click on **"Diagnostics"** tab
3. Click **"Run Diagnostics"** button

### Method 2: Direct Component
```tsx
import ConfigurationDiagnostic from '@/components/admin/ConfigurationDiagnostic';
```

## What Gets Checked

### 1. ✅ Supabase URL
- **Checks**: `VITE_SUPABASE_URL` environment variable
- **Expected**: `https://kudlclzjfihbphehhiii.supabase.co`
- **Fix**: Set in `.env` file

### 2. ✅ Supabase Anon Key
- **Checks**: `VITE_SUPABASE_ANON_KEY` environment variable
- **Expected**: Valid JWT token
- **Fix**: Copy from Supabase Dashboard > Settings > API

### 3. ✅ Edge Function Deployed
- **Checks**: `repair-diagnostic` function availability
- **Tests**: OPTIONS request to function endpoint
- **Fix**: Run deployment script or use Admin UI

### 4. ✅ OpenAI API Key
- **Checks**: `OPENAI_API_KEY` in Supabase secrets
- **Tests**: Actual function invocation
- **Fix**: Set in Supabase Dashboard > Edge Functions > Secrets

### 5. ✅ Network Latency
- **Checks**: Response time to Supabase
- **Expected**: < 1000ms (excellent), < 3000ms (acceptable)
- **Fix**: Check internet connection

## Common Issues & Fixes

### ❌ "OpenAI API key not configured"

**Cause**: Missing `OPENAI_API_KEY` in Supabase secrets

**Fix**:
```bash
# Option 1: Supabase CLI
supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Option 2: Supabase Dashboard
# Go to: Settings > Edge Functions > Secrets
# Add: OPENAI_API_KEY = sk-your-key-here
```

### ❌ "Function not responding"

**Cause**: Edge function not deployed

**Fix**:
```bash
# Deploy using one-click script
./deploy-repair-diagnostic-one-click.sh

# Or use Supabase CLI
supabase functions deploy repair-diagnostic
```

### ❌ "Cannot reach edge function"

**Cause**: Network/firewall blocking requests

**Fix**:
1. Check internet connection
2. Verify Supabase URL is correct
3. Check browser console for CORS errors
4. Try from different network

### ❌ "Missing VITE_SUPABASE_URL"

**Cause**: Environment variable not set

**Fix**:
```bash
# Create/update .env file
echo "VITE_SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co" >> .env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env

# Restart dev server
npm run dev
```

## Diagnostic Results

### Success ✅
```
✅ Supabase URL: Connected to https://kudlclzjfihbphehhiii.supabase.co
✅ Supabase Anon Key: Anon key configured
✅ Edge Function Deployed: repair-diagnostic function is deployed
✅ OpenAI API Key: OpenAI API key is configured
✅ Network Latency: 245ms response time (Excellent)
```

### Error ❌
```
❌ OpenAI API Key: OpenAI API key not set in Supabase secrets
   Details: Set OPENAI_API_KEY in Supabase Dashboard > Edge Functions > Secrets
```

## Manual Testing

### Test Edge Function Directly
```bash
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'
```

### Test in Browser Console
```javascript
const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test' }
});
console.log('Data:', data);
console.log('Error:', error);
```

## Next Steps After Diagnosis

1. **All checks pass**: Issue may be intermittent - check browser console logs
2. **OpenAI key missing**: Set in Supabase secrets (most common issue)
3. **Function not deployed**: Run deployment script
4. **Network issues**: Check firewall/proxy settings

## Support

If diagnostics show all green but errors persist:
1. Check browser console (F12) for detailed error logs
2. Review edge function logs in Supabase Dashboard
3. Verify OpenAI API key has sufficient credits
4. Check OpenAI API status: https://status.openai.com
