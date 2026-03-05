# 🔧 Repair Diagnostic Function Deployment

## Quick Deploy (One Command)

```bash
./deploy-repair-diagnostic-one-click.sh
```

This single command will:
- ✅ Check all prerequisites
- ✅ Verify OpenAI API key
- ✅ Deploy with automatic retry
- ✅ Test the function
- ✅ Show detailed status

## What This Function Does

The `repair-diagnostic` function is the core AI-powered repair assistant that:

1. **Analyzes repair issues** using OpenAI GPT-4
2. **Provides step-by-step solutions**
3. **Identifies required parts**
4. **Estimates repair difficulty**
5. **Suggests safety precautions**

## Deployment Options

### Option 1: Shell Script (Fastest)

```bash
chmod +x deploy-repair-diagnostic-one-click.sh
./deploy-repair-diagnostic-one-click.sh
```

**Features:**
- Automatic retry (3 attempts)
- Real-time status updates
- Color-coded output
- Function testing
- Error handling

### Option 2: Admin Dashboard (Visual)

1. Go to `/admin`
2. Click **"Deploy"** tab
3. Click **"Deploy Now"**
4. Watch real-time logs

**Features:**
- Visual progress indicator
- Scrollable log viewer
- Retry button
- Success/failure alerts

### Option 3: Manual CLI

```bash
# Deploy
supabase functions deploy repair-diagnostic --no-verify-jwt

# View logs
supabase functions logs repair-diagnostic
```

## Prerequisites Checklist

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged in to Supabase (`supabase login`)
- [ ] OpenAI API key set (`supabase secrets set OPENAI_API_KEY=...`)
- [ ] Function code exists in `supabase/functions/repair-diagnostic/`

## Verify Deployment

### Test via cURL

```bash
curl -X POST \
  https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -d '{
    "issue": "Faucet is leaking",
    "category": "plumbing"
  }'
```

### Test via Admin Dashboard

1. Go to `/admin`
2. Click **"Diagnostics"** tab
3. Use **"AI Assistant Connection Test"**
4. Click **"Test Connection"**

### Test via App

1. Go to main chat interface
2. Type a repair question
3. Verify AI responds with detailed steps

## Monitoring

### View Real-Time Logs

```bash
supabase functions logs repair-diagnostic --follow
```

### Check Function Status

```bash
supabase functions list
```

### Admin Dashboard Monitoring

- **Deploy Tab**: Deployment history
- **Diagnostics Tab**: Connection status
- **API Keys Tab**: Secret verification

## Troubleshooting

### Function Not Responding

1. **Check if deployed:**
   ```bash
   supabase functions list | grep repair-diagnostic
   ```

2. **View logs:**
   ```bash
   supabase functions logs repair-diagnostic
   ```

3. **Redeploy:**
   ```bash
   ./deploy-repair-diagnostic-one-click.sh
   ```

### OpenAI API Key Issues

1. **Verify secret is set:**
   ```bash
   supabase secrets list
   ```

2. **Update secret:**
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-your-new-key
   ```

3. **Redeploy function** (required after updating secrets)

### Deployment Fails

1. **Check function code:**
   ```bash
   cat supabase/functions/repair-diagnostic/index.ts
   ```

2. **Verify no syntax errors:**
   ```bash
   cd supabase/functions/repair-diagnostic
   deno check index.ts
   ```

3. **Try manual deploy:**
   ```bash
   supabase functions deploy repair-diagnostic --no-verify-jwt --debug
   ```

## Automatic Retry Logic

The deployment script includes smart retry logic:

- **Attempt 1**: Initial deployment
- **Wait 5 seconds** if failed
- **Attempt 2**: Retry deployment
- **Wait 5 seconds** if failed
- **Attempt 3**: Final retry
- **Rollback**: Exit with error if all fail

## Success Indicators

✅ **Script Output:**
```
✅ Deployment successful!
✓ Function is responding
🎉 Deployment complete!
```

✅ **Admin Dashboard:**
- Green success badge
- "Deployment successful!" message
- Function URL displayed

✅ **Function Test:**
- AI responds to test query
- No error messages
- Response includes repair steps

## Next Steps After Deployment

1. **Test thoroughly**: Try various repair scenarios
2. **Monitor usage**: Check logs for errors
3. **Set up alerts**: Configure health checks
4. **Update documentation**: Note any custom configurations

## Rollback Procedure

If the new deployment has issues:

```bash
# View deployment history
supabase functions list

# Redeploy previous version
# (Note: Supabase keeps previous versions)
supabase functions deploy repair-diagnostic --version <previous-version>
```

## Performance Tips

1. **Cold starts**: First request may be slow (5-10 seconds)
2. **Warm-up**: Use cache prewarming for better performance
3. **Monitoring**: Set up alerts for slow responses
4. **Optimization**: Review logs for bottlenecks

## Security Notes

- ✅ Function uses `--no-verify-jwt` (public access)
- ✅ OpenAI API key stored securely in Supabase secrets
- ✅ No API keys exposed in frontend code
- ✅ Rate limiting recommended for production

## Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **OpenAI Docs**: https://platform.openai.com/docs
- **Project Logs**: Check Admin Dashboard → Diagnostics
- **Function Logs**: `supabase functions logs repair-diagnostic`
