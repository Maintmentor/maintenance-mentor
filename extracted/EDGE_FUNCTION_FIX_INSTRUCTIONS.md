# Edge Function Deployment Fix

## Problem
The edge function `repair-diagnostic` is not being reached, resulting in "Failed to send a request to the Edge Function" errors.

## Solution Applied
Fixed the edge function import and serve syntax to use the correct Deno standard library.

## Changes Made

### 1. Fixed Import Statement
Changed from `Deno.serve` to proper import:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
```

### 2. Fixed Function Structure
- Properly closed the `fetchWithTimeout` helper function
- Added correct spacing between function definitions
- Used the imported `serve` function instead of `Deno.serve`

## Deployment Instructions

1. **Deploy the Edge Function:**
```bash
supabase functions deploy repair-diagnostic
```

2. **Verify Environment Variables:**
Ensure these are set in your Supabase project:
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY` 
- `GOOGLE_CSE_ID`

3. **Check Function Status:**
```bash
supabase functions list
```

4. **Test the Function:**
```bash
curl -X POST https://[YOUR_PROJECT_REF].supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"question": "What does a capacitor look like?"}'
```

## Additional Edge Functions to Deploy

Also deploy the cached image fetching function:
```bash
supabase functions deploy fetch-real-part-images-cached
```

## Troubleshooting

If errors persist after deployment:

1. **Check Logs:**
```bash
supabase functions logs repair-diagnostic
```

2. **Verify CORS Headers:**
The function includes proper CORS headers for cross-origin requests.

3. **Check API Keys:**
Ensure all required API keys are properly configured in Supabase dashboard under Settings > Edge Functions > Secrets.

## Expected Behavior
After deployment, the chat interface should:
1. Successfully call the edge function
2. Fetch real product images from Google Custom Search
3. Display images alongside text responses
4. Show shopping links for parts