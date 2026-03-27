# AI Image Generation Setup Guide

## Overview
The AI chat assistant can now generate custom diagrams and illustrations using DALL-E 3 to help explain repairs and maintenance concepts.

## Prerequisites
1. Supabase project with Edge Functions enabled
2. OpenAI API key with access to DALL-E 3
3. Supabase CLI installed

## Deployment Steps

### 1. Deploy the New Edge Function
```bash
# Deploy the image generation function
supabase functions deploy generate-repair-image

# Deploy the updated repair-diagnostic function
supabase functions deploy repair-diagnostic
```

### 2. Set OpenAI API Key (if not already set)
```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Verify Deployment
Test the function:
```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-repair-image' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"diagram of a faucet"}'
```

## How It Works

1. **User asks a question** in the chat interface
2. **AI analyzes** if a visual would be helpful
3. **AI generates** a JSON response with image prompt
4. **Edge function detects** the image request
5. **DALL-E 3 generates** the technical diagram
6. **Image displays** in the chat with a Save button

## Features

- ✅ Automatic diagram generation for relevant topics
- ✅ Manual diagram generation with custom prompts
- ✅ Save diagrams to user account
- ✅ Organize saved diagrams by category
- ✅ Add notes and labels to saved diagrams

## Cost Considerations

DALL-E 3 pricing (as of 2024):
- Standard quality: $0.040 per image (1024x1024)
- HD quality: $0.080 per image (1024x1024)

Current implementation uses standard quality.
