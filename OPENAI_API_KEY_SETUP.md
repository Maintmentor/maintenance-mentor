# Setting Up OPENAI_API_KEY as an Edge Function Secret

## Overview

The `repair-diagnostic` edge function is fully configured to make real OpenAI API calls. The **single remaining step** is to add your OpenAI API key as an edge function secret.

## Quick Setup (2 minutes)

### Step 1: Get an OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-`)
4. Ensure your OpenAI account has **billing enabled** with sufficient credits

### Step 2: Add the Secret

#### Option A: Dashboard (Recommended)

1. Open your **Database Dashboard**
2. Go to **Project Settings** → **Edge Functions**
3. Scroll to **Edge Function Secrets**
4. Click **"Add new secret"**
5. Set:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-your-actual-key-here`
6. Click **Save**

#### Option B: CLI

```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Verify

After adding the secret (allow up to 30 seconds for propagation):

1. Open the app and look for the **API Key Status Banner**
2. Click **"Verify Key Configuration"** or use the auto-verification feature
3. Or go to **Admin Dashboard** → **API Keys** tab → click **"Validate Key"** and **"Test AI Chat"**

## How It Works

The edge function code reads the key at runtime:

```typescript
// In repair-diagnostic/index.ts
const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GATEWAY_API_KEY');
```

It then makes real API calls to OpenAI:

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [...],
  }),
});
```

## Features Already Configured

The edge function includes:
- **Model fallback chain:** gpt-4o → gpt-4-turbo → gpt-3.5-turbo
- **Retry logic:** Exponential backoff with up to 3 retries
- **Rate limit handling:** Automatic retry on 429 responses
- **Conversation history:** Multi-turn chat support
- **Category detection:** Automatic repair category classification
- **Error handling:** Detailed error messages for debugging

## Security

- The API key is stored as a **server-side secret** — never exposed to the browser
- All AI requests go through the edge function, not directly from the client
- The key is accessed via `Deno.env.get()` in the secure Deno runtime

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not configured" | Add the `OPENAI_API_KEY` secret (see Step 2 above) |
| "Invalid API key" | Verify the key starts with `sk-` and hasn't been revoked |
| "Insufficient quota" | Add billing/credits to your OpenAI account |
| "Rate limited" | The function handles this automatically with retries |
| Key not detected after adding | Wait 30 seconds, then re-check. Secrets take time to propagate. |

## Project Details

- **Project:** `jilgcvmalrrxutzpqlui`
- **Edge Function:** `repair-diagnostic`
- **Secret Name:** `OPENAI_API_KEY`
- **Dashboard URL:** [Project Settings → Edge Functions](https://supabase.com/dashboard/project/jilgcvmalrrxutzpqlui/settings/functions)
