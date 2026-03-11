# AI Chat Interface Fix

## Issue
The AI chat interface was showing an error: "could not find 'images' column of 'messages' in the schema cache"

## Root Cause
The `messages` table in the database was missing the `images` and `metadata` columns that the chat interface code expects.

## Solution Applied

### 1. Database Migration Created
Created migration file: `supabase/migrations/20250106_add_images_to_messages.sql`

This migration adds:
- `images` column (JSONB) - stores array of image URLs uploaded with messages
- `metadata` column (JSONB) - stores message metadata (category, cost, difficulty, etc.)
- GIN index on metadata for faster queries

### 2. How to Apply the Fix

#### Option A: Using Supabase CLI (Recommended)
```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration to your database
supabase db push
```

#### Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250106_add_images_to_messages.sql`
4. Click **Run** to execute the migration

#### Option C: Manual SQL Execution
Run this SQL in your Supabase SQL editor:

```sql
-- Add images column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS images JSONB;

-- Add metadata column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN (metadata);
```

## Verification
After running the migration, the AI chat should work properly. You can verify by:
1. Opening the chat interface
2. Sending a message
3. Uploading an image
4. Confirming no errors appear in the console

## What Was Fixed
- ✅ Added `images` column to store uploaded photos
- ✅ Added `metadata` column to store AI response metadata
- ✅ Created index for better query performance
- ✅ Chat interface can now properly save and load messages with images

## Next Steps
If you continue to see errors:
1. Check that the migration ran successfully in Supabase dashboard
2. Verify the columns exist: `SELECT column_name FROM information_schema.columns WHERE table_name = 'messages';`
3. Clear your browser cache and reload the application
