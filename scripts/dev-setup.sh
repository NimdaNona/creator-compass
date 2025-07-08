#!/bin/bash

# Development setup script for CreatorCompass
set -e

echo "🛠️  Setting up CreatorCompass development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found!"
    echo "Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js version must be 20 or higher!"
    echo "Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📄 Creating .env.local from template..."
    cp .env.development.example .env.local
    echo "⚠️  Please update .env.local with your configuration!"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Setup database
echo "🗄️  Setting up database..."
npx prisma db push

# Seed database (if seed script exists)
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

# Start development servers with docker-compose
echo "🐳 Starting development services..."
docker-compose -f docker-compose.dev.yml up -d postgres-dev redis-dev

# Wait for services
echo "⏳ Waiting for development services..."
sleep 10

echo "✅ Development environment setup completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env.local with your OAuth credentials"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Visit http://localhost:3000"
echo ""
echo "🔧 Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm run test         - Run unit tests"
echo "  npm run test:e2e     - Run end-to-end tests"
echo "  npm run build        - Build for production"
echo "  npm run lint         - Run linter"