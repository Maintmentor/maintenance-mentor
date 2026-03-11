# Automatic .env File Repair System

## Overview
The system automatically detects corrupted environment variables, creates backups, and attempts to repair configuration issues without user intervention. It includes rollback functionality if repairs fail.

## Features

### 1. Automatic Backup System
- **Auto-backup on startup**: Creates backups when valid configuration is detected
- **Manual backups**: Users can create backups via admin dashboard
- **Backup history**: Stores up to 10 most recent backups in localStorage
- **Database logging**: Authenticated users get backups logged to Supabase

### 2. Auto-Repair on Startup
- **Validation check**: Runs on every app startup
- **Automatic repair**: Attempts to restore from most recent valid backup
- **Silent recovery**: If successful, shows brief success message then continues
- **Fallback to wizard**: If repair fails, opens setup wizard

### 3. Rollback Functionality
- **One-click rollback**: Restore to previous configuration state
- **Backup selection**: Choose specific backup to restore from
- **Validation after restore**: Ensures restored config is valid

### 4. Repair Logging
- **Detailed logs**: Tracks all repair attempts with timestamps
- **Success/failure tracking**: Records which keys were repaired
- **Error details**: Stores error messages for debugging
- **User attribution**: Links repairs to user accounts

## How It Works

### Startup Flow
```
1. App loads → EnvValidationBanner mounts
2. Validates current .env configuration
3. If invalid:
   a. Shows "Attempting Auto-Repair..." banner
   b. Fetches most recent valid backup from localStorage
   c. Attempts to repair corrupted keys
   d. Re-validates configuration
   e. If successful: Shows success message, auto-dismisses
   f. If failed: Shows setup wizard
4. If valid: No banner shown
```

### Backup Creation
```
- Triggered on: App startup (if valid), manual button click
- Stores: All environment variables as JSON
- Validates: Checks URL format, JWT structure, key formats
- Encrypts: Basic base64 encoding (upgrade to proper encryption in production)
- Limits: Keeps only 10 most recent backups
```

### Repair Process
```
1. Identify corrupted keys (URL format, JWT validation)
2. Load all backups, filter to valid ones only
3. Sort by timestamp (most recent first)
4. For each corrupted key:
   - Check if backup has valid value
   - Replace corrupted value with backup value
5. Validate repaired configuration
6. If valid: Save and return success
7. If invalid: Return failure with details
```

## Database Schema

### env_backups Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- backup_name: TEXT
- env_data: JSONB (encrypted configuration)
- is_valid: BOOLEAN
- validation_results: JSONB
- created_at: TIMESTAMPTZ
- created_by: TEXT
- notes: TEXT
```

### env_repair_logs Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- repair_type: TEXT ('automatic', 'manual', 'rollback')
- status: TEXT ('success', 'failed', 'partial')
- corrupted_keys: TEXT[]
- repaired_keys: TEXT[]
- backup_used_id: UUID (foreign key to env_backups)
- error_details: JSONB
- created_at: TIMESTAMPTZ
```

## Admin Dashboard

### EnvBackupManager Component
Location: `/admin` → Environment Backups section

Features:
- **Create Backup**: Manual backup creation
- **Auto Repair**: Trigger repair manually
- **Rollback**: Restore to previous state
- **Backup List**: View all available backups with:
  - Timestamp
  - Validation status
  - Source (auto/manual)
  - Keys included
  - Restore button

## API Integration

### Edge Function: env-backup-manager
**Endpoint**: `/functions/v1/env-backup-manager`

**Actions**:
1. `create_backup`: Create new backup
2. `restore_backup`: Restore from specific backup
3. `validate_keys`: Validate configuration

**Note**: Currently needs manual deployment. Run:
```bash
supabase functions deploy env-backup-manager
```

## Setup Instructions

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, run:
supabase/migrations/20250127_env_backup_system.sql
```

### 2. Deploy Edge Function (Optional)
```bash
# Deploy the backup manager function
supabase functions deploy env-backup-manager
```

### 3. Test Auto-Repair
1. Corrupt your .env file (change VITE_SUPABASE_ANON_KEY)
2. Reload the app
3. Watch auto-repair attempt in banner
4. If successful, banner shows success and auto-dismisses
5. If failed, setup wizard opens

## Security Considerations

### Current Implementation
- **localStorage**: Backups stored in browser localStorage
- **Base64 encoding**: Simple encoding (not true encryption)
- **Client-side only**: No server-side key storage

### Production Recommendations
1. **Encrypt backups**: Use proper encryption (AES-256)
2. **Server-side vault**: Store encrypted configs in Supabase
3. **Key rotation**: Implement automatic key rotation
4. **Access control**: Restrict backup access to admins only
5. **Audit trail**: Log all backup/restore operations

## Troubleshooting

### Auto-Repair Not Working
1. Check browser console for errors
2. Verify localStorage has backups: `localStorage.getItem('env_backups')`
3. Check if backups are valid
4. Try manual repair from admin dashboard

### No Backups Available
1. Create manual backup when config is valid
2. Check if localStorage is enabled
3. Verify user is authenticated for database backups

### Repair Fails Repeatedly
1. Check validation errors in console
2. Verify backup data integrity
3. Use setup wizard for manual configuration
4. Check Supabase project status

## Future Enhancements

1. **Cloud backup sync**: Sync backups across devices
2. **Scheduled backups**: Automatic daily/weekly backups
3. **Backup encryption**: Proper encryption at rest
4. **Version control**: Track configuration changes over time
5. **Team sharing**: Share validated configs with team members
6. **Backup export/import**: Download/upload backup files
7. **Smart repair**: ML-based detection of valid configurations
8. **Notification system**: Alert admins of repair attempts

## Testing

### Test Auto-Repair
```javascript
// In browser console:
localStorage.setItem('current_env_config', JSON.stringify({
  VITE_SUPABASE_URL: 'invalid-url',
  VITE_SUPABASE_ANON_KEY: 'invalid-key'
}));
location.reload();
```

### Test Manual Repair
1. Go to `/admin`
2. Navigate to Environment Backups
3. Click "Auto Repair"
4. Check repair status

### Test Rollback
1. Create backup with valid config
2. Corrupt config
3. Click "Rollback"
4. Verify config restored

## Support

For issues or questions:
1. Check browser console for detailed errors
2. Review repair logs in admin dashboard
3. Verify database tables exist
4. Check edge function deployment status
