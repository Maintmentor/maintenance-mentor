# ============================================
# STEP 1: Install Supabase CLI (run this FIRST)
# ============================================
# Pick ONE of these methods:

# Method A - Using npm:
# npm install -g supabase

# Method B - Using Scoop (recommended for Windows):
# scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
# scoop install supabase

# Method C - Using Winget:
# winget install Supabase.CLI

# ============================================
# STEP 2: Login to Supabase
# ============================================
# supabase login

# ============================================
# STEP 3: Link your project
# ============================================
# supabase link --project-ref YOUR_PROJECT_REF

# ============================================
# STEP 4: Deploy functions (run these one at a time)
# ============================================

Write-Host "Deploying Edge Functions..." -ForegroundColor Cyan

$functions = @(
    "health-check",
    "repair-diagnostic",
    "fetch-real-part-images",
    "fetch-real-part-images-cached",
    "generate-repair-image",
    "api-key-validator",
    "storage-monitor",
    "trial-reminder-email",
    "cache-alert-email-sender",
    "image-cache-handler",
    "slack-alert-sender"
)

foreach ($func in $functions) {
    $path = "supabase/functions/$func"
    if (Test-Path $path) {
        Write-Host "Deploying $func..." -ForegroundColor Yellow
        supabase functions deploy $func --no-verify-jwt
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $func deployed" -ForegroundColor Green
        } else {
            Write-Host "FAILED: $func" -ForegroundColor Red
        }
    } else {
        Write-Host "SKIPPED: $func (folder not found)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
