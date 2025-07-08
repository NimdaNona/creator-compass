#!/bin/bash

# Docker build script for CreatorCompass
set -e

echo "🐳 Building CreatorCompass Docker image..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
IMAGE_NAME="creator-compass"

echo "📦 Building version: $VERSION"

# Build the Docker image
docker build \
  --platform linux/amd64,linux/arm64 \
  -t $IMAGE_NAME:$VERSION \
  -t $IMAGE_NAME:latest \
  .

echo "✅ Docker image built successfully!"
echo "🏷️  Tagged as: $IMAGE_NAME:$VERSION and $IMAGE_NAME:latest"

# Optional: Show image size
echo "📊 Image size:"
docker images $IMAGE_NAME:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"