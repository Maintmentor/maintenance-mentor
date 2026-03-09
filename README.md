# Maintenance Mentor

A React + TypeScript + Vite application for maintenance tracking and repair management, powered by Supabase.

## 🚀 Deploy to Netlify

This app is configured for Netlify deployment via `netlify.toml`.

### Quick Deploy

1. **Connect your GitHub repo** to Netlify
2. **Build settings** are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variables** in Netlify site settings:
   - `VITE_SUPABASE_URL` — Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — Your Supabase anon key
   - `VITE_OPENAI_API_KEY` — (Optional) For AI features
   - `VITE_STRIPE_PUBLISHABLE_KEY` — (Optional) For payments
4. Click **Deploy** 🎉

### Local Development

```bash
cp .env.example .env   # Add your API keys to .env
npm install
npm run dev
```

See `NETLIFY_DEPLOYMENT_GUIDE.md` for detailed deployment instructions.
