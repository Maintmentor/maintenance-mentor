#!/bin/bash

echo "🔧 AI CONNECTION FIX SCRIPT"
echo "=========================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Supabase login..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "🔑 Please run: supabase login"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Deploy edge function
echo "🚀 Deploying repair-diagnostic edge function..."
supabase functions deploy repair-diagnostic --project-ref kudlclzjfihbphehhiii

if [ $? -eq 0 ]; then
    echo "✅ Edge function deployed successfully"
else
    echo "❌ Failed to deploy edge function"
    echo "   Try manually: npx supabase functions deploy repair-diagnostic"
fi

echo ""
echo "📋 NEXT STEPS:"
echo "1. Add OPENAI_API_KEY to Supabase secrets:"
echo "   https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/functions"
echo ""
echo "2. Get OpenAI key from:"
echo "   https://platform.openai.com/api-keys"
echo ""
echo "3. Test connection at:"
echo "   http://localhost:5173"
echo ""
echo "✅ Script complete!"
