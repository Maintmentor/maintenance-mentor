#!/bin/bash

# AI Agent Quick Fix Script
# This script will help you fix the AI agent issues

echo "🔧 AI Agent Quick Fix Tool"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if supabase CLI is installed
echo -e "${BLUE}Step 1: Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
else
    echo -e "${GREEN}✅ Supabase CLI found${NC}"
fi

# Step 2: Check current secrets
echo ""
echo -e "${BLUE}Step 2: Checking Supabase secrets...${NC}"
echo "Running: supabase secrets list"
supabase secrets list

echo ""
echo -e "${YELLOW}Do you see OPENAI_API_KEY in the list above? (y/n)${NC}"
read -r has_key

if [ "$has_key" != "y" ]; then
    echo ""
    echo -e "${YELLOW}Please enter your OpenAI API key (starts with sk-):${NC}"
    read -r openai_key
    
    if [[ $openai_key == sk-* ]]; then
        echo "Setting OPENAI_API_KEY in Supabase..."
        supabase secrets set OPENAI_API_KEY="$openai_key"
        echo -e "${GREEN}✅ OpenAI API key set${NC}"
    else
        echo -e "${RED}❌ Invalid API key format (should start with sk-)${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ OpenAI API key already configured${NC}"
fi

# Step 3: Deploy edge function
echo ""
echo -e "${BLUE}Step 3: Deploying repair-diagnostic edge function...${NC}"
echo "Running: supabase functions deploy repair-diagnostic"
supabase functions deploy repair-diagnostic

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Edge function deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy edge function${NC}"
    echo "Please check your Supabase project configuration"
    exit 1
fi

# Step 4: Test the function
echo ""
echo -e "${BLUE}Step 4: Testing edge function...${NC}"
echo "Please enter your Supabase project URL (e.g., https://xxxxx.supabase.co):"
read -r supabase_url
echo "Please enter your Supabase anon key:"
read -r anon_key

# Test with curl
echo ""
echo "Testing edge function..."
response=$(curl -s -X POST "${supabase_url}/functions/v1/repair-diagnostic" \
  -H "Authorization: Bearer ${anon_key}" \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I fix a leaky faucet?"}')

if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Edge function is working!${NC}"
    echo "Response preview:"
    echo "$response" | head -c 200
    echo "..."
else
    echo -e "${RED}❌ Edge function test failed${NC}"
    echo "Response:"
    echo "$response"
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "1. Check edge function logs: supabase functions logs repair-diagnostic"
    echo "2. Verify your OpenAI API key is valid"
    echo "3. Check your Supabase project is running"
fi

# Step 5: Final instructions
echo ""
echo -e "${BLUE}Step 5: Final Setup${NC}"
echo ""
echo -e "${GREEN}✅ Backend setup complete!${NC}"
echo ""
echo -e "${YELLOW}Now update your frontend:${NC}"
echo "1. Remove VITE_OPENAI_API_KEY from your .env file"
echo "2. Remove it from Netlify environment variables"
echo "3. Restart your development server"
echo ""
echo "The AI agent should now be working!"
echo ""
echo -e "${BLUE}Test it by:${NC}"
echo "1. Going to your app"
echo "2. Opening the chat interface"
echo "3. Asking: 'How do I fix a leaky faucet?'"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"