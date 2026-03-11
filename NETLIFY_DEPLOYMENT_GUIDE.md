# 🚀 Deploy to Netlify - Step by Step

Your app is **already configured** for Netlify! Follow these steps:

---

## Option 1: Deploy via GitHub (Recommended) ⭐

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com) → Sign up/Login
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → Authorize Netlify
4. Select your repository

### Step 3: Configure Build Settings
Netlify auto-detects from `netlify.toml`, but verify:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Step 4: Add Environment Variables ⚠️ IMPORTANT
1. Go to **Site settings** → **Environment variables**
2. Add these variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://kudlclzjfihbphehhiii.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_OPENAI_API_KEY` | Your OpenAI key (optional) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe key (optional) |

### Step 5: Deploy!
Click **"Deploy site"** - Done! 🎉

---

## Option 2: Drag & Drop Deploy

### Step 1: Build Locally
```bash
npm run build
```

### Step 2: Upload
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `dist` folder onto the page
3. Add environment variables in Site settings

---

## 🔧 After Deployment

### Custom Domain
1. **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow DNS instructions

### Auto-Deploy
With GitHub connected, every push to `main` auto-deploys!

### Check Deploy Logs
If issues occur, check **Deploys** → Click latest → View logs

---

## ✅ Your Config Files (Already Set Up)

- `netlify.toml` - Build & redirect config
- `public/_redirects` - SPA routing fallback

**You're ready to deploy!** 🚀
