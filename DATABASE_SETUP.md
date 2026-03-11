# Database Setup Instructions

## Fixing "Database Error Saving New User"

If you're getting a database error when creating a new account, follow these steps:

### Option 1: Run Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20241230_create_profiles_table.sql`
5. Click **Run** to execute the migration
6. Verify the migration ran successfully (you should see "Success. No rows returned")

### Option 2: Run Migration via Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (you'll need your project reference ID)
supabase link --project-ref your-project-ref

# Run all pending migrations
supabase db push
```

### What This Migration Does

1. **Creates the profiles table** with all necessary columns for user data
2. **Sets up Row Level Security (RLS)** policies to protect user data
3. **Creates an automatic trigger** that creates a profile when a user signs up
4. **Activates a 7-day free trial** automatically for new users
5. **Creates database indexes** for better performance

### Verify the Setup

After running the migration, test by:

1. Try creating a new account
2. Check if the account is created successfully
3. Verify you can see the trial banner after signup

### Troubleshooting

**Still getting errors?**

1. Check Supabase logs: Dashboard → Logs → Database
2. Verify the migration ran: Dashboard → Database → Tables (you should see `profiles` table)
3. Check RLS policies: Dashboard → Authentication → Policies
4. Ensure your Supabase project is not paused

**Need to reset?**

If you need to start fresh, run this in SQL Editor:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS profiles CASCADE;
```

Then run the migration again.
