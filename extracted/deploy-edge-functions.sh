#!/bin/bash

# Automated Edge Function Deployment Script
# Checks for missing/outdated functions and deploys automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    print_status "Checking Supabase CLI installation..."
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI not found!"
        echo "Install it with: npm install -g supabase"
        exit 1
    fi
    print_success "Supabase CLI found"
}

# Load environment variables
load_env() {
    print_status "Loading environment variables..."
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
        print_success "Environment loaded"
    else
        print_error ".env file not found!"
        exit 1
    fi
}

# Validate Supabase connection
validate_connection() {
    print_status "Validating Supabase connection..."
    
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        print_error "Missing Supabase credentials in .env"
        exit 1
    fi
    
    print_success "Credentials found"
}

# List of critical edge functions
EDGE_FUNCTIONS=(
    "health-check"
    "repair-diagnostic"
    "slack-alert-sender"
    "storage-monitor"
    "api-key-validator"
    "trial-reminder-email"
    "cache-alert-email-sender"
    "image-cache-handler"
)

# Check which functions exist locally
check_local_functions() {
    print_status "Checking local edge functions..."
    
    MISSING_FUNCTIONS=()
    EXISTING_FUNCTIONS=()
    
    for func in "${EDGE_FUNCTIONS[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            EXISTING_FUNCTIONS+=("$func")
            print_success "Found: $func"
        else
            MISSING_FUNCTIONS+=("$func")
            print_warning "Missing locally: $func"
        fi
    done
    
    echo ""
}

# Deploy a single edge function
deploy_function() {
    local func_name=$1
    print_status "Deploying $func_name..."
    
    if supabase functions deploy "$func_name" --no-verify-jwt 2>&1 | tee /tmp/deploy_output.log; then
        print_success "Deployed: $func_name"
        return 0
    else
        print_error "Failed to deploy: $func_name"
        cat /tmp/deploy_output.log
        return 1
    fi
}

# Deploy all existing functions
deploy_all_functions() {
    print_status "Starting deployment of ${#EXISTING_FUNCTIONS[@]} functions..."
    echo ""
    
    DEPLOYED=0
    FAILED=0
    
    for func in "${EXISTING_FUNCTIONS[@]}"; do
        if deploy_function "$func"; then
            ((DEPLOYED++))
        else
            ((FAILED++))
        fi
        echo ""
    done
    
    print_status "Deployment Summary:"
    echo "  ✓ Deployed: $DEPLOYED"
    echo "  ✗ Failed: $FAILED"
    echo ""
}

# Test deployed functions
test_functions() {
    print_status "Testing deployed functions..."
    
    # Test health-check
    if [[ " ${EXISTING_FUNCTIONS[@]} " =~ " health-check " ]]; then
        print_status "Testing health-check function..."
        HEALTH_URL="${VITE_SUPABASE_URL}/functions/v1/health-check"
        
        if curl -s -X POST "$HEALTH_URL" \
            -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            --max-time 10 > /dev/null 2>&1; then
            print_success "health-check is responding"
        else
            print_warning "health-check test failed (may need time to start)"
        fi
    fi
    
    echo ""
}

# Generate deployment report
generate_report() {
    print_status "Generating deployment report..."
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Edge Function Deployment Report"
        echo "================================"
        echo "Date: $(date)"
        echo ""
        echo "Deployed Functions:"
        for func in "${EXISTING_FUNCTIONS[@]}"; do
            echo "  ✓ $func"
        done
        echo ""
        if [ ${#MISSING_FUNCTIONS[@]} -gt 0 ]; then
            echo "Missing Functions (not deployed):"
            for func in "${MISSING_FUNCTIONS[@]}"; do
                echo "  ✗ $func"
            done
        fi
    } > "$REPORT_FILE"
    
    print_success "Report saved: $REPORT_FILE"
}

# Main execution
main() {
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║  Edge Function Deployment Automation      ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    
    check_supabase_cli
    load_env
    validate_connection
    check_local_functions
    
    if [ ${#EXISTING_FUNCTIONS[@]} -eq 0 ]; then
        print_error "No edge functions found to deploy!"
        exit 1
    fi
    
    echo ""
    read -p "Deploy ${#EXISTING_FUNCTIONS[@]} functions? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_all_functions
        test_functions
        generate_report
        
        print_success "Deployment complete!"
        echo ""
        echo "Next steps:"
        echo "  1. Check deployment report for details"
        echo "  2. Test functions in Supabase dashboard"
        echo "  3. Monitor logs: supabase functions logs <function-name>"
    else
        print_warning "Deployment cancelled"
    fi
}

# Run main function
main
