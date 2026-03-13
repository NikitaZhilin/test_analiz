#!/bin/bash

# Script for production deployment
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on server
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: docker-compose.prod.yml not found!${NC}"
    echo "Please run this script from the backend directory on the production server."
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}📦 Pulling latest changes...${NC}"
git pull origin main

# Build and restart containers
echo -e "${YELLOW}🔨 Building containers...${NC}"
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for database
echo -e "${YELLOW}⏳ Waiting for database...${NC}"
sleep 10

# Run migrations
echo -e "${YELLOW}📊 Running migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Seed initial data (optional)
echo -e "${YELLOW}🌱 Seeding initial data...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend python -m app.scripts.seed || true

# Show status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo -e "${GREEN}🎉 Application is running!${NC}"
echo "Frontend: http://localhost:5174"
echo "Backend: http://localhost:8000"
echo "API Docs: http://localhost:8000/api/docs"
