#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting CreatorCompass application..."

# Run database migrations
echo "📄 Running database migrations..."
npx prisma migrate deploy

# Seed the database if needed
echo "🌱 Checking database setup..."
npx prisma db push

echo "✅ Database setup complete!"

# Start the Next.js application
echo "🎯 Starting Next.js server..."
exec node server.js