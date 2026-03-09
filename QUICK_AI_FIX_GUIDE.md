# 🚀 QUICK AI FIX - 3 STEPS

## Problem: App won't connect to AI

## ✅ SOLUTION:

### Step 1: Add OpenAI API Key to Supabase (2 minutes)

1. **Get OpenAI Key:**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **Add to Supabase:**
   - Go to: https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/functions
   - Click "Edge Functions" tab
   - Click "Add Secret"
   - Name: `OPENAI_API_KEY`
   - Value: Paste your key
   - Click "Save"

### Step 2: Deploy Edge Function (1 minute)

Run in terminal:
```bash
npx supabase login
npx supabase functions deploy repair-diagnostic --project-ref kudlclzjfihbphehhiii
```

### Step 3: Test It (30 seconds)

1. Open your app: http://localhost:5173
2. Click the chat icon
3. Type: "test"
4. You should get an AI response!

## 🧪 Still Not Working?

Open test page: `public/test-ai-connection.html`

This will show you exactly what's wrong.

## 📋 Common Issues:

**"Function not found"**
→ Run: `npx supabase functions deploy repair-diagnostic`

**"OpenAI API key not configured"**
→ Add key to Supabase secrets (Step 1)

**"Invalid API key"**
→ Generate new key at https://platform.openai.com/api-keys

**"Network error"**
→ Check internet connection and try again

## ✅ Success!

When working, you'll see:
- AI responds in 5-10 seconds
- Real product images appear
- No errors in console (F12)

Need more help? Check `FIX_AI_CONNECTION_NOW.md`
