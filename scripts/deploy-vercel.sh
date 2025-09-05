#!/bin/bash

# KonBase Vercel Deployment Script
# This script helps deploy KonBase to Vercel with proper configuration

set -e

echo "🚀 KonBase Vercel Deployment"
echo "============================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel@latest
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp env.example .env.local
    echo "📝 Please update .env.local with your production values:"
    echo "   - NEXTAUTH_SECRET"
    echo "   - NEXTAUTH_URL"
    echo "   - GEL_DATABASE_URL"
    echo "   - OAuth credentials (if using)"
    echo ""
    read -p "Press Enter when you've updated .env.local..."
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."

if [ "$1" = "--prod" ]; then
    echo "📦 Deploying to production..."
    vercel --prod
else
    echo "🔍 Deploying preview..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔧 Useful Vercel commands:"
echo "  vercel --prod          # Deploy to production"
echo "  vercel                  # Deploy preview"
echo "  vercel logs             # View logs"
echo "  vercel env add          # Add environment variables"
echo "  vercel domains add      # Add custom domain"
echo ""
echo "📚 For more information, see:"
echo "  https://vercel.com/docs"
