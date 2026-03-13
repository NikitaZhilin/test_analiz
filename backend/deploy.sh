#!/bin/bash
# Production deployment script for VPS

set -e

APP_DIR="/opt/analyses-app"
ENV_FILE="$APP_DIR/backend/.env.prod"

echo "=== Production Deployment Script ==="
echo "App directory: $APP_DIR"

# Check if .env.prod exists
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found!"
    echo "Please create it from .env.prod.example first:"
    echo "  cp $APP_DIR/backend/.env.prod.example $ENV_FILE"
    echo "  # Then edit with real values"
    exit 1
fi

cd "$APP_DIR"

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    echo "Pulling latest changes..."
    git pull origin main
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Build and start services
echo "Building and starting services..."
docker compose -f backend/docker-compose.prod.yml up -d --build

# Run migrations
echo "Running database migrations..."
docker compose -f backend/docker-compose.prod.yml exec -T backend alembic upgrade head

# Show status
echo ""
echo "=== Deployment Complete ==="
docker compose -f backend/docker-compose.prod.yml ps

echo ""
echo "Service available at: http://77.239.103.15/"
echo "API docs: http://77.239.103.15/api/docs"
