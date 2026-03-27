# Fix Invalid API Key Error

## Problem
Your `.env` file has a **malformed Supabase anon key** causing authentication to fail.

## Current (Incorrect) Key
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZGxjbHpqZmloYnBoZWhoaWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5OTU3MzcsImV4cCI6MjA1MDU3MTczN30.sb_publishable_uTh05YYYItYyXOduWlzlLw_vrzOgRHh
```

**Issue:** The signature part (after the second dot) is corrupted with "sb_publishable_" which is not a valid JWT signature.

## Solution

### Step 1: Get Your Correct Anon Key
1. Go to https://supabase.com/dashboard
2. Select your project: **kudlclzjfihbphehhiii**
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** under Project Settings
5. Find **Project API keys** section
6. Copy the **anon public** key (it should be a long JWT token)

### Step 2: Update Your .env File
Replace the current `VITE_SUPABASE_ANON_KEY` value with the correct one from Supabase dashboard.

A valid key looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZGxjbHpqZmloYnBoZWhoaWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5OTU3MzcsImV4cCI6MjA1MDU3MTczN30.VALID_SIGNATURE_HERE
```

### Step 3: Restart Your Dev Server
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### Step 4: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Verification
After fixing, sign in should work without the "invalid api key" error.
