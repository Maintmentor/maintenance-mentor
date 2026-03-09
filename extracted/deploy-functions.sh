#!/bin/bash

# Deploy Repair Diagnostic Edge Function Script
# This script deploys the repair-diagnostic function to Supabase

echo "🚀 Deploying Repair Diagnostic Edge Function..."
echo "============================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Login to Supabase (if not already logged in)
echo "📝 Checking Supabase login status..."
if ! npx supabase projects list &> /dev/null; then
    echo "Please login to Supabase:"
    npx supabase login
fi

# Link to project
echo "🔗 Linking to project..."
npx supabase link --project-ref kudlclzjfihbphehhiii

# Check if OPENAI_API_KEY is set
echo "🔑 Checking OpenAI API key..."
if ! npx supabase secrets list | grep -q "OPENAI_API_KEY"; then
    echo "⚠️  OPENAI_API_KEY not found in secrets!"
    echo "Please enter your OpenAI API key:"
    read -s OPENAI_KEY
    npx supabase secrets set OPENAI_API_KEY=$OPENAI_KEY
    echo "✅ OpenAI API key added to secrets"
else
    echo "✅ OpenAI API key found in secrets"
fi

# Deploy the function
echo "📦 Deploying repair-diagnostic function..."
npx supabase functions deploy repair-diagnostic

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 5

# Test the function
echo "🧪 Testing the function..."
TEST_RESPONSE=$(npx supabase functions invoke repair-diagnostic --body '{
  "question": "How do I fix a leaky faucet?",
  "imageUrls": [],
  "conversationId": null,
  "userId": "test-user"
}' 2>&1)

# Check if test was successful
if echo "$TEST_RESPONSE" | grep -q "success"; then
    echo "✅ Function deployed and tested successfully!"
    echo ""
    echo "📊 Function Details:"
    echo "- Name: repair-diagnostic"
    echo "- Status: ACTIVE"
    echo "- URL: https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic"
    echo ""
    echo "🎉 AI Agent should now be working in your app!"
else
    echo "⚠️  Function deployed but test failed. Response:"
    echo "$TEST_RESPONSE"
    echo ""
    echo "Please check:"
    echo "1. OpenAI API key is valid and has credits"
    echo "2. Function logs in Supabase dashboard"
    echo "3. Network connectivity"
fi

echo ""
echo "📝 View logs at: https://app.supabase.com/project/kudlclzjfihbphehhiii/functions/repair-diagnostic/logs"
echo "============================================"
echo "Deployment complete!"