#!/bin/bash

# 🚀 Deploy Repair Diagnostic Edge Function
# This script deploys the repair-diagnostic function and sets up required secrets

echo "🔧 Deploying Repair Diagnostic Edge Function..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Deploy the function
echo "📤 Deploying repair-diagnostic function..."
supabase functions deploy repair-diagnostic

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
else
    echo "❌ Function deployment failed"
    exit 1
fi

echo ""
echo "🔑 Now set your API keys:"
echo ""
echo "1. OpenAI API Key (Required):"
echo "   supabase secrets set OPENAI_API_KEY=sk-your-key-here"
echo ""
echo "2. Google API Keys (Optional - for image search):"
echo "   supabase secrets set GOOGLE_API_KEY=your-google-api-key"
echo "   supabase secrets set GOOGLE_CSE_ID=your-cse-id"
echo ""
echo "🧪 Test the function:"
echo "   supabase functions logs repair-diagnostic --tail"
echo ""
echo "✅ Deployment complete!"
