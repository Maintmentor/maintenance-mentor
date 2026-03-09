# 🔧 FIX AI CONNECTION - STEP BY STEP

## ❌ Problem: "App won't connect to AI"

## ✅ SOLUTION (Follow in Order):

### Step 1: Check OpenAI API Key
```bash
# Go to Supabase Dashboard
https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/functions

# Click "Edge Functions" → "Secrets"
# Check if OPENAI_API_KEY exists
```

**If missing, add it:**
1. Get key from: https://platform.openai.com/api-keys
2. Click "Add Secret" in Supabase
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI key (starts with `sk-`)
5. Click "Save"

### Step 2: Deploy Edge Function
```bash
# Run this command in terminal:
npx supabase functions deploy repair-diagnostic

# Or use the deploy script:
./deploy-edge-functions.sh
```

### Step 3: Test Connection
Open browser console (F12) and run:
```javascript
// Test edge function directly
const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test' }
});
console.log('Result:', data, error);
```

### Step 4: Check CORS Settings
In Supabase Dashboard:
1. Go to Settings → API
2. Scroll to "CORS Configuration"
3. Add your domain: `https://your-app.netlify.app`
4. Add localhost: `http://localhost:5173`

### Step 5: Verify Environment Variables
Check `.env` file has:
```env
VITE_SUPABASE_URL=https://kudlclzjfihbphehhiii.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🚀 QUICK FIX SCRIPT

Run this to fix everything automatically:
```bash
chmod +x fix-ai-connection.sh
./fix-ai-connection.sh
```

## 🧪 TEST AI CONNECTION

Visit: http://localhost:5173/test-ai-connection

This will:
- ✅ Check Supabase connection
- ✅ Test edge function
- ✅ Verify OpenAI key
- ✅ Show detailed error logs

## 📋 Common Error Messages

### "OpenAI API key not configured"
→ Add OPENAI_API_KEY to Supabase edge function secrets

### "Function not found"
→ Deploy edge function: `npx supabase functions deploy repair-diagnostic`

### "Network error" or "CORS error"
→ Add your domain to CORS settings in Supabase

### "Invalid API key"
→ Check OpenAI key is valid at https://platform.openai.com/api-keys

## 🔍 Still Not Working?

1. Open browser console (F12)
2. Go to Network tab
3. Try sending a message
4. Look for red errors
5. Share the error message for specific help

## ✅ Success Indicators

You'll know it's working when:
- Chat sends messages without errors
- AI responds within 5-10 seconds
- No red errors in console
- Images appear in responses
