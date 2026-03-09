# Fix: Images Not Showing in Chat

## Problem
When users ask the AI to show pictures/images, they don't appear in the chat.

## Root Causes

### 1. **OpenAI API Key Not Set in Supabase**
The edge functions need the OpenAI API key to generate images, but it may not be configured.

### 2. **Edge Function Not Deployed**
The latest code with image generation may not be deployed to Supabase.

### 3. **Silent Error Handling**
Image generation errors are caught but not shown to users (line 195-197 in repair-diagnostic).

## Quick Fix

### Step 1: Set OpenAI API Key in Supabase
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-api-key
```

### Step 2: Deploy Both Edge Functions
```bash
supabase functions deploy repair-diagnostic
supabase functions deploy generate-repair-image
```

### Step 3: Verify in Supabase Dashboard
1. Go to Edge Functions in Supabase Dashboard
2. Check that both functions are deployed
3. Go to Settings > Edge Functions > Secrets
4. Verify OPENAI_API_KEY is set

## Testing
After deployment, test by asking:
- "What does a capacitor look like?"
- "Show me a toilet fill valve"
- "Generate an image of a water heater element"

## How It Works
1. User asks for image → AI responds with `GENERATE_IMAGE: [description]`
2. Edge function detects this trigger (line 170)
3. Calls DALL-E 3 API to generate image (lines 176-194)
4. Returns image URL in response
5. ChatInterface displays it (lines 350-374)
