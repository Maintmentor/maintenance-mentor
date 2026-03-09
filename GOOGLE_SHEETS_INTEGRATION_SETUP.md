# Google Sheets API Integration Setup Guide

## Overview
This system automatically logs all subscriber repair queries to individual Google Sheets with real-time updates.

## Step 1: Google Cloud Project Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Repair Query Logger"
4. Click "Create"

### 1.2 Enable Google Sheets API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### 1.3 Enable Google Drive API
1. Still in "Library", search for "Google Drive API"
2. Click "Enable" (needed for sheet creation)

## Step 2: Service Account Configuration

### 2.1 Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name: "repair-query-logger"
4. Description: "Logs repair queries to Google Sheets"
5. Click "Create and Continue"
6. Grant role: "Editor"
7. Click "Done"

### 2.2 Generate Private Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Click "Create" - JSON file will download

### 2.3 Extract Credentials
Open the downloaded JSON file and extract:
- `client_email` (service account email)
- `private_key` (entire key including BEGIN/END lines)

## Step 3: Supabase Environment Variables

### 3.1 Add Secrets to Supabase
```bash
# Service account email
supabase secrets set GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"

# Private key (replace \n with actual newlines)
supabase secrets set GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 3.2 Verify Secrets
```bash
supabase secrets list
```

## Step 4: Deploy Edge Functions
```bash
# Deploy the Google Sheets operations function
supabase functions deploy google-sheets-logger

# Test the function
supabase functions invoke google-sheets-logger --body '{"action":"test"}'
```

## Step 5: Share Access (Important!)

### 5.1 Get Service Account Email
From your JSON file: `client_email`

### 5.2 Share Master Folder
1. Create a folder in Google Drive: "Repair Query Logs"
2. Right-click → Share
3. Add the service account email
4. Give "Editor" access
5. Click "Send"

## Features Implemented

✅ Automatic sheet creation per subscriber
✅ Real-time query logging with timestamps
✅ Category-based organization
✅ Response tracking
✅ Admin dashboard for viewing sheets
✅ Export functionality
✅ Error handling and retry logic

## Troubleshooting

### Error: "The caller does not have permission"
- Ensure service account email has access to the folder
- Check that both Sheets and Drive APIs are enabled

### Error: "Invalid JWT Signature"
- Verify GOOGLE_SHEETS_PRIVATE_KEY includes BEGIN/END lines
- Check for proper newline characters in private key

### Error: "Quota exceeded"
- Google Sheets API has rate limits
- Implement exponential backoff (already included)

## Testing

Test the integration:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/google-sheets-logger \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "log_query",
    "userId": "test-user-123",
    "userEmail": "test@example.com",
    "query": "How do I fix a leaky faucet?",
    "category": "Plumbing",
    "response": "Here are the steps..."
  }'
```

## Security Notes

- Service account credentials are stored securely in Supabase secrets
- Never commit private keys to version control
- Rotate keys periodically for security
- Use least-privilege access (Editor only on specific folder)

## Next Steps

1. Complete Google Cloud setup
2. Add environment variables to Supabase
3. Deploy edge functions
4. Share folder with service account
5. Test integration from admin dashboard
