#!/bin/bash

# Deployment script for CreatorCompass
set -e

echo "🚀 Deploying CreatorCompass..."

# Check if environment file exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose not found!"
    echo "Please install docker-compose first."
    exit 1
fi

# Backup existing data (if any)
if [ -d "backups" ]; then
    echo "💾 Creating backup..."
    mkdir -p backups/$(date +%Y%m%d_%H%M%S)
    docker-compose exec -T postgres pg_dump -U creator_user creator_compass > backups/$(date +%Y%m%d_%H%M%S)/database.sql 2>/dev/null || echo "No existing database to backup"
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose down
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout 120 bash -c 'until docker-compose ps | grep -q "healthy"; do sleep 5; done'

# Run database migrations
echo "📄 Running database migrations..."
docker-compose exec app npx prisma migrate deploy

# Check health
echo "🔍 Checking application health..."
curl -f http://localhost:3000/api/health || {
    echo "❌ Health check failed!"
    docker-compose logs app
    exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: http://localhost:3000"
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"