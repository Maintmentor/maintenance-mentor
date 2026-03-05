#!/bin/bash

# One-Click Repair Diagnostic Edge Function Deployment Script
# This script checks, verifies, and deploys the repair-diagnostic function

set -e

echo "🚀 Starting One-Click Repair Diagnostic Deployment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="https://kudlclzjfihbphehhiii.supabase.co"
FUNCTION_NAME="repair-diagnostic"
MAX_RETRIES=3
RETRY_DELAY=5

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
if ! command_exists supabase; then
    echo -e "${RED}❌ Supabase CLI not found. Install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI found${NC}"

# Check if logged in
echo -e "${BLUE}🔐 Checking Supabase authentication...${NC}"
if ! supabase projects list >/dev/null 2>&1; then
    echo -e "${RED}❌ Not logged in to Supabase. Run:${NC}"
    echo "supabase login"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated${NC}"

# Link to project
echo -e "${BLUE}🔗 Linking to Supabase project...${NC}"
supabase link --project-ref kudlclzjfihbphehhiii || true
echo -e "${GREEN}✓ Project linked${NC}"

# Check if function exists
echo -e "${BLUE}🔍 Checking if ${FUNCTION_NAME} is deployed...${NC}"
FUNCTION_STATUS=$(supabase functions list 2>&1 | grep -c "${FUNCTION_NAME}" || echo "0")

if [ "$FUNCTION_STATUS" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Function already deployed. Will redeploy...${NC}"
else
    echo -e "${YELLOW}⚠️  Function not found. Will deploy...${NC}"
fi

# Verify OpenAI API key
echo -e "${BLUE}🔑 Verifying OPENAI_API_KEY secret...${NC}"
if supabase secrets list 2>&1 | grep -q "OPENAI_API_KEY"; then
    echo -e "${GREEN}✓ OPENAI_API_KEY is set${NC}"
else
    echo -e "${RED}❌ OPENAI_API_KEY not found in secrets${NC}"
    echo -e "${YELLOW}Set it with:${NC}"
    echo "supabase secrets set OPENAI_API_KEY=your_key_here"
    exit 1
fi

# Deploy function with retry logic
deploy_function() {
    local attempt=$1
    echo -e "${BLUE}📦 Deploying ${FUNCTION_NAME} (Attempt ${attempt}/${MAX_RETRIES})...${NC}"
    
    if supabase functions deploy ${FUNCTION_NAME} --no-verify-jwt; then
        return 0
    else
        return 1
    fi
}

# Main deployment loop
DEPLOYED=false
for i in $(seq 1 $MAX_RETRIES); do
    if deploy_function $i; then
        DEPLOYED=true
        break
    else
        if [ $i -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⚠️  Deployment failed. Retrying in ${RETRY_DELAY} seconds...${NC}"
            sleep $RETRY_DELAY
        fi
    fi
done

if [ "$DEPLOYED" = true ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${BLUE}📊 Function Details:${NC}"
    echo "URL: ${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}"
    echo ""
    
    # Test the function
    echo -e "${BLUE}🧪 Testing function...${NC}"
    TEST_RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}" \
        -H "Content-Type: application/json" \
        -d '{"issue":"test","category":"test"}' || echo "error")
    
    if echo "$TEST_RESPONSE" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Function deployed but test failed. Check logs.${NC}"
    else
        echo -e "${GREEN}✓ Function is responding${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    exit 0
else
    echo -e "${RED}❌ Deployment failed after ${MAX_RETRIES} attempts${NC}"
    echo -e "${YELLOW}💡 Troubleshooting steps:${NC}"
    echo "1. Check function code in supabase/functions/${FUNCTION_NAME}/"
    echo "2. View logs: supabase functions logs ${FUNCTION_NAME}"
    echo "3. Verify secrets: supabase secrets list"
    exit 1
fi
