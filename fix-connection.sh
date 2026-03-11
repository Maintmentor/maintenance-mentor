#!/bin/bash

echo "🔧 Connection Fix Script"
echo "======================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "📋 Opening Supabase dashboard in your browser..."
echo "Please copy the 'anon public' key from the API settings page."
echo ""

# Open Supabase dashboard
if command -v xdg-open > /dev/null; then
    xdg-open "https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/api"
elif command -v open > /dev/null; then
    open "https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/api"
else
    echo "Please open this URL manually:"
    echo "https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/api"
fi

echo ""
echo "Paste your Supabase anon key here:"
read -r ANON_KEY

if [ -z "$ANON_KEY" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

# Validate key format
if [[ ! $ANON_KEY =~ ^eyJ ]]; then
    echo "❌ Invalid key format. Key should start with 'eyJ'"
    exit 1
fi

echo ""
echo "✅ Key format looks good!"
echo "📝 Updating .env file..."

# Update .env file
sed -i.bak "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$ANON_KEY|g" .env

echo "✅ .env file updated successfully!"
echo ""
echo "🧪 Testing connection..."

# Test connection using curl
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    "https://kudlclzjfihbphehhiii.supabase.co/rest/v1/")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Connection successful!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Restart your dev server: npm run dev"
    echo "   2. Open http://localhost:5173"
    echo "   3. Check the Admin dashboard for diagnostics"
else
    echo "⚠️  Connection test returned status: $RESPONSE"
    echo "   This might be okay if tables don't exist yet."
    echo "   Run: supabase db push"
fi

echo ""
echo "✨ Setup complete!"
