# Automated Configuration Repair System

## Overview
Automated system that detects missing OpenAI API keys, validates them, and provides step-by-step setup instructions.

## Features

### 1. API Key Validation
- **Format Checking**: Validates API key starts with "sk-" and has minimum length
- **Connection Testing**: Tests actual connection to OpenAI API
- **Real-time Feedback**: Instant validation results with detailed error messages

### 2. Configuration Detection
- Automatically checks if OpenAI API key is configured in Supabase
- Detects missing or invalid API keys
- Caches configuration status in localStorage

### 3. Setup Guidance
- Step-by-step instructions for setting API keys in Supabase
- Visual feedback with color-coded status badges
- Automatic re-checking after configuration changes

## Components

### AutomatedConfigRepair Component
Location: `src/components/admin/AutomatedConfigRepair.tsx`

Features:
- Configuration status overview
- API key input with password masking
- Validation button with loading states
- Setup instructions after successful validation

### envRepairService
Location: `src/services/envRepairService.ts`

Functions:
- `checkOpenAIKey()`: Checks if API key exists and is valid
- `validateOpenAIKey(apiKey)`: Validates API key format and tests connection
- `saveConfigStatus()`: Caches configuration status
- `getConfigStatus()`: Retrieves cached status

## Edge Functions

### openai-key-validator
Tests OpenAI API key validity by:
1. Validating format (starts with "sk-", minimum 20 characters)
2. Making test request to OpenAI API
3. Returning validation result with detailed error messages

## Usage

### Admin Dashboard
1. Navigate to Admin Dashboard → Diagnostics tab
2. View "Automated Configuration Repair" card at top
3. Click "Check Configuration" to test current setup
4. If key is missing/invalid, enter your OpenAI API key
5. Click "Validate & Get Setup Instructions"
6. Follow the provided setup instructions

### Manual Testing
```javascript
import { envRepairService } from '@/services/envRepairService';

// Check current configuration
const status = await envRepairService.checkOpenAIKey();
console.log(status);

// Validate a new API key
const result = await envRepairService.validateOpenAIKey('sk-...');
console.log(result);
```

## Setup Instructions

### Setting API Key in Supabase
1. Go to Supabase Dashboard (supabase.com)
2. Select your project
3. Navigate to Settings → Edge Functions
4. Click on "Secrets" tab
5. Add new secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your validated API key
6. Save changes
7. Redeploy edge functions (optional but recommended)

### Verifying Setup
After setting the API key:
1. Return to Admin Dashboard → Diagnostics
2. Click "Check Configuration"
3. Status should show green "Valid" badge

## Error Messages

### Invalid Format
- "API key is required and must be a string"
- "Invalid OpenAI API key format. Must start with 'sk-' and be at least 20 characters"

### Connection Errors
- "OpenAI API key validation failed: [error message]"
- Includes HTTP status code for debugging

### Configuration Errors
- "AI service returned an error" (indicates missing key in Supabase)
- "Failed to check configuration" (network/permission issues)

## Troubleshooting

### Key Validates But Still Getting Errors
1. Ensure key is set in Supabase (not just validated)
2. Check edge function deployment status
3. Clear browser cache and retry
4. Verify Supabase project has correct permissions

### Validation Fails
1. Double-check API key is copied correctly
2. Verify key is active in OpenAI dashboard
3. Check OpenAI account has available credits
4. Test key directly at platform.openai.com

### Configuration Check Fails
1. Verify Supabase connection is working
2. Check edge function deployment status
3. Review browser console for detailed errors
4. Ensure user has admin permissions

## Security Notes

- API keys are never stored in frontend code
- Keys are masked in UI (password input type)
- Validation happens server-side via edge function
- Keys must be set in Supabase secrets (secure environment)
- No API keys are logged or cached

## Future Enhancements

Planned features:
- Automatic API key setting via Supabase Management API
- Automatic edge function redeployment after key changes
- Support for multiple API providers (Anthropic, etc.)
- API key rotation and expiration tracking
- Usage monitoring and cost alerts
