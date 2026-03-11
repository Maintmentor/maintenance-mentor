#!/bin/bash

# 🧪 Test App Locally
# This script checks if the app is running correctly

echo "🔍 Checking App Status..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and add your Supabase keys"
    echo ""
fi

# Check if .env has real keys
if grep -q "your_anon_key_here" .env; then
    echo "⚠️  .env still has placeholder values"
    echo "📝 Please update .env with your real Supabase keys"
    echo ""
fi

# Build check
echo "🏗️  Checking if app builds..."
npm run build 2>&1 | tee build.log

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Starting development server..."
    echo "📱 Open http://localhost:5173 in your browser"
    echo ""
    npm run dev
else
    echo "❌ Build failed!"
    echo "📄 Check build.log for errors"
    exit 1
fi
