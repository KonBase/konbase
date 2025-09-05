#!/bin/bash

# KonBase Production Setup Script
# This script helps users set up KonBase securely for production

set -e

echo "🚀 KonBase Production Setup"
echo "=============================="

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Copy production template
echo "📋 Creating .env file from production template..."
cp env.production .env

echo ""
echo "🔐 SECURITY SETUP REQUIRED"
echo "=========================="
echo "Please update the following variables in .env:"
echo ""
echo "1. NEXTAUTH_SECRET - Generate a secure secret (32+ characters)"
echo "2. NEXTAUTH_URL - Your production domain (https://yourdomain.com)"
echo "3. DB_PASSWORD - Strong database password (16+ characters)"
echo "4. APP_URL - Your production domain"
echo ""
echo "Optional but recommended:"
echo "5. GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET - For Google OAuth"
echo "6. DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET - For Discord OAuth"
echo "7. SMTP_* variables - For email functionality"
echo ""

# Generate a random secret if openssl is available
if command -v openssl &> /dev/null; then
    RANDOM_SECRET=$(openssl rand -base64 32)
    echo "💡 Suggested NEXTAUTH_SECRET: $RANDOM_SECRET"
    echo ""
fi

echo "📝 Edit .env file now, then press Enter to continue..."
read -p "Press Enter when you've updated the .env file..."

# Validate required variables
echo "🔍 Validating configuration..."

if ! grep -q "your-super-secret-key-minimum-32-characters-long" .env; then
    echo "✅ NEXTAUTH_SECRET appears to be configured"
else
    echo "❌ Please update NEXTAUTH_SECRET in .env"
    exit 1
fi

if ! grep -q "https://yourdomain.com" .env; then
    echo "✅ NEXTAUTH_URL appears to be configured"
else
    echo "❌ Please update NEXTAUTH_URL in .env"
    exit 1
fi

if ! grep -q "your-secure-database-password-minimum-16-characters" .env; then
    echo "✅ DB_PASSWORD appears to be configured"
else
    echo "❌ Please update DB_PASSWORD in .env"
    exit 1
fi

echo ""
echo "🐳 Starting KonBase in production mode..."
echo "========================================"

# Start with production compose file
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "🎉 KonBase is starting up!"
echo "========================="
echo ""
echo "📊 Monitor the startup process:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🌐 Once ready, access your application at:"
echo "$(grep NEXTAUTH_URL .env | cut -d'=' -f2)"
echo ""
echo "🔧 Useful commands:"
echo "  Stop:     docker-compose -f docker-compose.prod.yml down"
echo "  Restart:  docker-compose -f docker-compose.prod.yml restart"
echo "  Logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "  Update:   docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "📚 For more information, see README.md"
