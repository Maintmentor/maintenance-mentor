# 🖼️ Image Functions Deployment Checklist

Step-by-step guide for deploying the 3 image edge functions:
- `fetch-real-part-images` — searches Google Images for real part photos
- `fetch-real-part-images-cached` — cached version with faster repeated lookups
- `generate-repair-image` — generates AI repair illustrations via OpenAI

---

## Part 1 — Prerequisites

- [ ] Supabase CLI installed and up to date
  ```bash
  npm install -g supabase
  supabase --version   # should be ≥ 1.x
  ```
- [ ] Authenticated with Supabase
  ```bash
  supabase login
  ```
- [ ] Project linked
  ```bash
  supabase link --project-ref YOUR_PROJECT_REF
  ```
- [ ] `.env` file present with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Three function directories exist locally
  ```bash
  ls supabase/functions/fetch-real-part-images
  ls supabase/functions/fetch-real-part-images-cached
  ls supabase/functions/generate-repair-image
  ```

---

## Part 2 — Secret Configuration

Set the following secrets in the Supabase Dashboard under  
**Project Settings → Edge Functions → Secrets**, or via the CLI:

| Secret | Purpose | Example format |
|--------|---------|---------------|
| `GOOGLE_API_KEY` | Authenticates Google Custom Search API calls made by `fetch-real-part-images` and `fetch-real-part-images-cached` | `AIzaSy...` |
| `GOOGLE_CSE_ID` | Identifies the Custom Search Engine used for part-image lookups | `017...` |
| `OPENAI_API_KEY` | Powers AI image generation inside `generate-repair-image` | `sk-...` |

### Set secrets via CLI

```bash
supabase secrets set GOOGLE_API_KEY=AIzaSy...
supabase secrets set GOOGLE_CSE_ID=017...
supabase secrets set OPENAI_API_KEY=sk-...
```

### Verify secrets are present

```bash
supabase secrets list
# Expected output includes GOOGLE_API_KEY, GOOGLE_CSE_ID, OPENAI_API_KEY
```

---

## Part 3 — Deployment Options

Choose **one** of the following methods.

### Option A — CLI one-liner (recommended)

Deploys all three image functions in a single command:

```bash
supabase functions deploy fetch-real-part-images fetch-real-part-images-cached generate-repair-image --no-verify-jwt
```

### Option B — Automated script

Uses the project's existing deployment automation, which handles error reporting and generates a report file:

```bash
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

When prompted, enter `y` to confirm deployment.

### Option C — Windows PowerShell

```powershell
$functions = @("fetch-real-part-images","fetch-real-part-images-cached","generate-repair-image")
foreach ($func in $functions) {
    Write-Host "Deploying $func..."
    supabase functions deploy $func --no-verify-jwt
    if ($LASTEXITCODE -ne 0) { Write-Warning "Failed: $func" }
    else { Write-Host "OK: $func" }
}
```

### Option D — Deploy individually

Deploy each function one at a time (useful for pinpointing failures):

```bash
supabase functions deploy fetch-real-part-images --no-verify-jwt
supabase functions deploy fetch-real-part-images-cached --no-verify-jwt
supabase functions deploy generate-repair-image --no-verify-jwt
```

### Option E — GitHub Actions

Trigger the `Deploy Edge Functions` workflow manually from the GitHub Actions tab:

1. Open **Actions → Deploy Edge Functions → Run workflow**
2. Leave the function name field **empty** to redeploy all functions, or enter a specific function name (e.g. `generate-repair-image`)
3. Click **Run workflow**
4. Monitor the run log for any failures

---

## Part 4 — Verification

### 4a — Supabase Dashboard check

1. Open [app.supabase.com](https://app.supabase.com) → your project → **Edge Functions**
2. Confirm the three functions appear in the list with status **Active**

### 4b — cURL tests

Replace `YOUR_PROJECT` and `YOUR_ANON_KEY` with your actual values.

```bash
# fetch-real-part-images
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/fetch-real-part-images \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"partName":"brake pad"}' \
  --fail --silent --show-error

# fetch-real-part-images-cached
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/fetch-real-part-images-cached \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"partName":"air filter"}' \
  --fail --silent --show-error

# generate-repair-image
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/generate-repair-image \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"repairType":"oil change"}' \
  --fail --silent --show-error
```

A `200` or `201` response indicates the function is live.

### 4c — Validator script

The project's deployment validator now includes image function checks:

```bash
node validate-deployment.js
```

Look for the **Image Functions Status** section in the output. All three should show `LIVE`.

### 4d — In-app test

1. Open the application and navigate to any repair or part-lookup page
2. Trigger a part image search or repair image generation
3. Verify images load without error messages in the UI
4. Check the browser console for any failed network requests to the edge functions

---

## Part 5 — Log Monitoring

View logs for each function in real time to watch for errors during and after deployment:

```bash
# Tail live logs
supabase functions logs fetch-real-part-images --tail
supabase functions logs fetch-real-part-images-cached --tail
supabase functions logs generate-repair-image --tail

# View recent logs (non-interactive)
supabase functions logs fetch-real-part-images
supabase functions logs fetch-real-part-images-cached
supabase functions logs generate-repair-image
```

Watch for these log patterns:

| Pattern | Meaning |
|---------|---------|
| `Google API request failed` | `GOOGLE_API_KEY` or `GOOGLE_CSE_ID` missing or invalid |
| `OpenAI API error` | `OPENAI_API_KEY` missing, invalid, or quota exceeded |
| `Function not found` | Function was not deployed successfully |
| `CORS error` | Missing or incorrect CORS headers in the function |
| `timeout` | Function exceeded execution limit (optimize or check API latency) |

---

## Part 6 — Troubleshooting

### Function shows "Not Found" (404)

The function was not deployed or the name is misspelled.

```bash
supabase functions list          # confirm it appears
supabase functions deploy fetch-real-part-images --no-verify-jwt
```

### Google image search returns no results

1. Verify `GOOGLE_API_KEY` is valid and has the **Custom Search API** enabled in Google Cloud Console
2. Verify `GOOGLE_CSE_ID` matches the search engine configured for image search
3. Check quota: free tier allows 100 queries/day
4. Inspect logs: `supabase functions logs fetch-real-part-images`

### OpenAI image generation fails

1. Confirm `OPENAI_API_KEY` is set: `supabase secrets list`
2. Confirm the key has access to the **DALL·E / Images API**
3. Check your OpenAI billing dashboard for quota limits
4. Inspect logs: `supabase functions logs generate-repair-image`

### Cached function not returning cached data

The `fetch-real-part-images-cached` function depends on Supabase storage or a cache table. Ensure:
- The required storage bucket exists, or the cache table is migrated
- The function has read/write permissions to that resource

### CORS errors in the browser

Ensure each function returns `corsHeaders` for `OPTIONS` preflight requests. Check the source in `supabase/functions/FUNCTION_NAME/index.ts`.

### Deployment times out or hangs

```bash
# Increase CLI timeout (if supported) or deploy with verbose output
supabase functions deploy fetch-real-part-images --no-verify-jwt --debug
```

---

## Part 7 — Quick Reference Card

```
DEPLOY (all three):
  supabase functions deploy fetch-real-part-images fetch-real-part-images-cached generate-repair-image --no-verify-jwt

SET SECRETS:
  supabase secrets set GOOGLE_API_KEY=...
  supabase secrets set GOOGLE_CSE_ID=...
  supabase secrets set OPENAI_API_KEY=...

VALIDATE:
  node validate-deployment.js

LOGS:
  supabase functions logs fetch-real-part-images --tail
  supabase functions logs fetch-real-part-images-cached --tail
  supabase functions logs generate-repair-image --tail

ROLLBACK → see Part 8 below
```

---

## Part 8 — Rollback Instructions

If a newly deployed image function causes regressions, redeploy the last known good version.

### Via GitHub Actions (recommended)

1. Open **Actions → Rollback Edge Functions** (or **Deploy Edge Functions**)
2. Enter the function name to roll back
3. The workflow re-deploys from the last successful commit

### Via CLI

```bash
# 1. Find the last good commit
git log --oneline supabase/functions/generate-repair-image/

# 2. Checkout that version of the function
git checkout <GOOD_COMMIT_SHA> -- supabase/functions/generate-repair-image/

# 3. Redeploy
supabase functions deploy generate-repair-image --no-verify-jwt

# 4. Restore HEAD (so only the function is rolled back)
git checkout HEAD -- supabase/functions/generate-repair-image/
```

Repeat for `fetch-real-part-images` or `fetch-real-part-images-cached` as needed.

### Verify after rollback

```bash
node validate-deployment.js
# Image Functions Status should show all three as LIVE
```

---

*For the full deployment guide see [DEPLOYMENT.md](./DEPLOYMENT.md)*  
*For CI/CD configuration see `.github/workflows/deploy-edge-functions.yml`*
