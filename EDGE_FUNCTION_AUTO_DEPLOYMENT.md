# Automated Configuration & Edge Function Deployment System

## Overview
This system provides automated configuration management with the ability to set Supabase secrets directly from the admin dashboard and automatically redeploy edge functions after configuration changes.

## Features

### 1. Automated Secret Management
- Set API keys and secrets directly from the admin dashboard
- Validate API key format before setting
- Secure server-side secret management via Supabase Management API
- No manual CLI commands required

### 2. Progress Tracking
- Real-time progress indicator during deployment
- Step-by-step status updates:
  - Validating API key format (20%)
  - Setting secret in Supabase (40%)
  - Redeploying edge functions (70%)
  - Deployment complete (100%)

### 3. Deployment History
- Track all configuration changes
- View deployment status (pending, completed, failed)
- See deployment type (manual, auto, rollback)
- Timestamp for each deployment

### 4. Rollback Capability
- One-click rollback to previous configuration
- Automatic restoration of previous secret values
- Rollback history tracking

## Setup Requirements

### 1. Supabase Management API Key
You need to set up the Supabase Management API key as an environment variable:

```bash
# Get your Management API key from:
# https://supabase.com/dashboard/account/tokens

# Set as Supabase secret:
supabase secrets set SUPABASE_MANAGEMENT_API_KEY="your_management_api_key"
```

### 2. Project Reference
Set your Supabase project reference:

```bash
supabase secrets set SUPABASE_PROJECT_REF="your_project_ref"
```

You can find your project reference in your Supabase project URL:
`https://app.supabase.com/project/[PROJECT_REF]`

## Usage

### Setting an API Key

1. Navigate to **Admin Dashboard → Deploy tab**
2. Enter the secret name (e.g., `OPENAI_API_KEY`)
3. Enter the API key value (e.g., `sk-...`)
4. Click **Set Secret & Deploy**
5. Monitor progress in real-time
6. Wait for completion confirmation

### Viewing Deployment History

The deployment history shows:
- Function name
- Deployment status (completed, failed, pending)
- Deployment type (manual, auto, rollback)
- Timestamp
- Error messages (if failed)

### Rolling Back a Deployment

1. Find the deployment in the history
2. Click the **Rollback** button
3. Confirm the rollback action
4. System will restore previous configuration
5. Edge functions will be automatically redeployed

## Edge Functions

### supabase-secret-manager
Manages Supabase secrets via Management API

**Actions:**
- `set` - Set or update a secret
- `list` - List all secrets (names only)
- `delete` - Delete a secret

**Example:**
```typescript
const { data } = await supabase.functions.invoke('supabase-secret-manager', {
  body: {
    action: 'set',
    secretName: 'OPENAI_API_KEY',
    secretValue: 'sk-...'
  }
});
```

### edge-function-deployment-manager
Manages edge function deployments

**Actions:**
- `list` - List all edge functions
- `redeploy` - Trigger redeployment of a function

**Example:**
```typescript
const { data } = await supabase.functions.invoke('edge-function-deployment-manager', {
  body: {
    action: 'redeploy',
    functionName: 'repair-diagnostic'
  }
});
```

## Database Schema

### edge_function_deployments Table
Tracks all deployment history:

```sql
- id: UUID (primary key)
- function_name: TEXT
- deployment_type: TEXT (manual, auto, rollback)
- status: TEXT (pending, in_progress, completed, failed)
- config_changes: JSONB
- previous_config: JSONB
- error_message: TEXT
- deployed_by: UUID (references auth.users)
- created_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
```

## Security

### API Key Encryption
- API keys are never stored in plain text in the frontend
- All secret management happens server-side via edge functions
- Supabase Management API key is stored securely as an environment variable

### Authentication
- Only authenticated admin users can access deployment features
- Row Level Security (RLS) policies enforce access control
- All actions are logged with user attribution

## Troubleshooting

### "Management API key not configured"
Set the `SUPABASE_MANAGEMENT_API_KEY` secret:
```bash
supabase secrets set SUPABASE_MANAGEMENT_API_KEY="your_key"
```

### "Project reference not provided"
Set the `SUPABASE_PROJECT_REF` secret:
```bash
supabase secrets set SUPABASE_PROJECT_REF="your_project_ref"
```

### "Failed to set secret"
- Verify Management API key is valid
- Check project reference is correct
- Ensure you have proper permissions

### "Failed to redeploy function"
- Verify function exists in your project
- Check Management API key has deployment permissions
- Review edge function logs for errors

## Best Practices

1. **Always test in development first**
   - Test secret changes in a development environment
   - Verify edge functions work after redeployment

2. **Monitor deployment status**
   - Watch the progress indicator
   - Check deployment history for errors
   - Review edge function logs after deployment

3. **Use rollback when needed**
   - Keep deployment history for rollback capability
   - Test rollback in development environment
   - Document configuration changes

4. **Secure your Management API key**
   - Never commit Management API keys to version control
   - Rotate keys periodically
   - Use separate keys for development and production

## Integration with Other Systems

### Automated Configuration Repair
The deployment system integrates with the automated configuration repair system to:
- Detect missing API keys
- Validate API key format
- Automatically set secrets
- Redeploy affected edge functions

### API Key Validator
Works with the OpenAI key validator to:
- Test API key connectivity
- Validate key format
- Provide feedback on key status

## Future Enhancements

- [ ] Batch secret updates
- [ ] Scheduled deployments
- [ ] Deployment approval workflows
- [ ] Multi-environment support
- [ ] Automated testing before deployment
- [ ] Slack/email notifications for deployments
- [ ] Deployment templates
- [ ] Configuration versioning
