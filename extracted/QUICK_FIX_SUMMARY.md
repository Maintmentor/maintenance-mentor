# 🚀 Quick Fix for AI Agent - Action Required!

## The Problem
Your AI agent isn't working because the OpenAI API key needs to be properly set in Supabase.

## The Solution (Choose One)

### 🎯 Fastest Fix (30 seconds)
Run this in your terminal:
```bash
chmod +x deploy-functions.sh && ./deploy-functions.sh
```

### 🖱️ Manual Fix via Dashboard (2 minutes)
1. Go to: https://app.supabase.com/project/kudlclzjfihbphehhiii
2. Navigate to: Settings → Edge Functions → Secrets
3. Add/Update `OPENAI_API_KEY` with your key (starts with `sk-`)
4. Go to: Edge Functions → repair-diagnostic → Click "Deploy"

### ✅ Verify It's Working
1. Open your app's chat interface
2. Type: "My faucet is leaking"
3. You should get an AI response with repair steps!

## Still Not Working?

Check these common issues:
- ❌ Wrong API key (should start with `sk-`)
- ❌ No OpenAI credits/expired subscription
- ❌ Edge function not deployed
- ❌ CORS errors (check browser console)

## Files Created to Help You

1. **deploy-functions.sh** - Automated deployment script
2. **diagnose-ai-agent.js** - Diagnostic tool to check issues
3. **DEPLOY_REPAIR_DIAGNOSTIC.md** - Detailed deployment guide
4. **TEST_AI_AGENT.md** - Testing instructions

## Command Not Working?

If you can't run the script, here's the manual process:

```bash
# Step 1: Set the secret in Supabase
npx supabase secrets set OPENAI_API_KEY=your-key-here

# Step 2: Deploy the function
npx supabase functions deploy repair-diagnostic

# Step 3: Test it
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## 🎉 Success Indicators

When it's working, you'll see:
- ✅ AI responses in the chat
- ✅ Repair steps with images
- ✅ Part recommendations
- ✅ Cost estimates

## Need More Help?

Share any error messages you see, and I can provide more specific guidance!