# AI Chat Agent Setup Guide

Your AI troubleshooting agent for residential repairs is now configured! Follow these steps to get it working:

## 🚀 Quick Setup

### 1. Deploy the Supabase Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the repair-diagnostic function
supabase functions deploy repair-diagnostic
```

### 2. Configure OpenAI API Key

```bash
# Set your OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key and use it in step 2 above

## 🎯 How It Works

The AI agent now uses a **Supabase Edge Function** instead of client-side API calls:

- ✅ **Secure**: API key stays on the server
- ✅ **GPT-4 Vision**: Analyzes uploaded repair images
- ✅ **Contextual**: Maintains conversation history
- ✅ **Detailed**: Provides step-by-step repair instructions

## 💬 Features

- **Text Analysis**: Describe repair issues in natural language
- **Image Analysis**: Upload photos for visual diagnostics
- **Repair Steps**: Get detailed, step-by-step instructions
- **Cost Estimates**: Receive estimated repair costs
- **Tools List**: Know what tools you'll need
- **Safety Warnings**: Important safety information
- **Parts Sourcing**: Links to HD Supply and other retailers
- **Voice Controls**: Speak your questions, hear responses
- **Translation**: Multi-language support

## 🧪 Testing

Click the floating chat button (bottom-right) and try:

- "My AC isn't cooling properly"
- "There's a leak under my kitchen sink"
- Upload a photo of a broken appliance
- "How do I fix a running toilet?"

## 🔧 Troubleshooting

If the AI isn't responding:

1. **Check Edge Function**: Ensure it's deployed
   ```bash
   supabase functions list
   ```

2. **Verify API Key**: Make sure it's set correctly
   ```bash
   supabase secrets list
   ```

3. **Check Logs**: View function logs for errors
   ```bash
   supabase functions logs repair-diagnostic
   ```

4. **Test Function**: Invoke it directly
   ```bash
   supabase functions invoke repair-diagnostic --data '{"message":"test"}'
   ```

## 📝 Database Tables

The chat system uses these Supabase tables:
- `conversations` - Chat sessions
- `messages` - Individual messages
- `repair-photos` storage bucket - Uploaded images

Make sure these are set up in your Supabase project!

## 💡 Tips

- Be specific in your descriptions for better diagnostics
- Upload clear, well-lit photos for image analysis
- The AI remembers conversation context for follow-up questions
- Use voice controls for hands-free operation during repairs

## 🎨 Customization

Edit `supabase/functions/repair-diagnostic/index.ts` to customize:
- System prompts
- Response format
- AI model (GPT-4, GPT-4 Vision, etc.)
- Temperature and other parameters
