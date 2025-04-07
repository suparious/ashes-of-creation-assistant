#!/bin/bash

# Script to fix common container issues

# Text styling
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}=== MyAshes.ai Container Fix Tool ===${NC}\n"

# Check if docker-compose command is available
if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}docker-compose command not found. Using 'docker compose' instead...${NC}"
  DOCKER_COMPOSE="docker compose"
else
  DOCKER_COMPOSE="docker-compose"
fi

# Stop all containers
echo -e "${BOLD}Stopping all containers...${NC}"
$DOCKER_COMPOSE down
echo -e "${GREEN}Done${NC}"

# Fix Etcd configuration in docker-compose.yml
echo -e "\n${BOLD}Fixing etcd configuration...${NC}"
sed -i 's/--advertise-client-urls=http:\/\/127.0.0.1:2379/--advertise-client-urls=http:\/\/etcd:2379/g' docker-compose.yml
echo -e "${GREEN}Updated etcd advertise URLs in docker-compose.yml${NC}"

# Fix nginx configuration
echo -e "\n${BOLD}Creating development nginx configuration...${NC}"
mkdir -p ../nginx/conf
cat > ../nginx/conf/default.conf << EOL
server {
    listen 80;
    server_name localhost;
    server_tokens off;

    # Proxy requests to frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;  # Longer timeout for API responses
    }

    # Static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_pass http://frontend:3000/static/;
    }

    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /404.html {
        root /var/www/html;
        internal;
    }
    location = /50x.html {
        root /var/www/html;
        internal;
    }
}
EOL
echo -e "${GREEN}Created new nginx configuration${NC}"

# Create required directories
mkdir -p ../nginx/www
mkdir -p ../nginx/ssl

# Create error pages
cat > ../nginx/www/404.html << EOL
<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { font-size: 36px; margin-bottom: 20px; }
        p { font-size: 18px; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <p><a href="/">Return to home</a></p>
</body>
</html>
EOL

cat > ../nginx/www/50x.html << EOL
<!DOCTYPE html>
<html>
<head>
    <title>Server Error</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { font-size: 36px; margin-bottom: 20px; }
        p { font-size: 18px; }
    </style>
</head>
<body>
    <h1>Server Error</h1>
    <p>Sorry, something went wrong on our end.</p>
    <p><a href="/">Return to home</a></p>
</body>
</html>
EOL
echo -e "${GREEN}Created error pages${NC}"

# Fix data-pipeline
echo -e "\n${BOLD}Fixing data-pipeline entry point...${NC}"
if [ -f "../data-pipeline/entrypoint.sh" ]; then
  chmod +x ../data-pipeline/entrypoint.sh
  echo -e "${GREEN}Fixed data-pipeline entrypoint permissions${NC}"
else
  echo -e "${YELLOW}Data pipeline entrypoint not found. Will use CMD instead.${NC}"
fi

# Modify docker-compose file to use explicit volume paths for Milvus
echo -e "\n${BOLD}Updating volume paths...${NC}"
mkdir -p ../docker-volumes/milvus
mkdir -p ../docker-volumes/etcd
mkdir -p ../docker-volumes/minio

# Create a new version of docker-compose.dev.yml with fixed settings
cat > docker-compose.dev.yml << EOL
version: '3.8'

# Development-specific overrides

services:
  # Frontend in development mode with hot reloading
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    volumes:
      - ../frontend:/app
      - /app/node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development

  # Backend with auto-reload
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    volumes:
      - ../backend:/app
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Data pipeline in development mode
  data-pipeline:
    build:
      context: ../data-pipeline
      dockerfile: Dockerfile
    volumes:
      - ../data-pipeline:/app
    environment:
      - LOG_LEVEL=debug
    command: python3 /app/main.py

  # Milvus with development settings
  milvus-standalone:
    ports:
      - "19530:19530"  # Expose API port for direct access in development
      - "9091:9091"    # Expose UI port
    environment:
      - ETCD_ENDPOINTS=etcd:2379
      - MINIO_ADDRESS=minio:9000
      - ETCD_USE_EMBED=true
      - COMMON_SECURITY_ENABLED=false  # Disable authentication in dev for simplicity
    volumes:
      - ../docker-volumes/milvus:/var/lib/milvus
    restart: unless-stopped

  # Etcd with development settings
  etcd:
    command: etcd --advertise-client-urls=http://etcd:2379 --listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    volumes:
      - ../docker-volumes/etcd:/etcd
    restart: unless-stopped

  # MinIO with development settings
  minio:
    volumes:
      - ../docker-volumes/minio:/data
    restart: unless-stopped

  # Redis with development settings
  redis:
    ports:
      - "6379:6379"    # Expose Redis port for direct access
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-ashes_default_pass} --loglevel debug

  # Development-friendly Nginx configuration
  nginx:
    volumes:
      - ../nginx/conf/default.conf:/etc/nginx/conf.d/default.conf
      - ../nginx/www:/var/www/html
    depends_on:
      - frontend
      - backend
    
  # Disable Certbot in development
  certbot:
    profiles: ["disabled"]
    
  # PostgreSQL with development settings
  postgres:
    ports:
      - "5432:5432"    # Expose PostgreSQL port for direct access
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-ashes_dev}
EOL
echo -e "${GREEN}Created updated docker-compose.dev.yml${NC}"

# Check if .env file exists and has required variables
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}No .env file found. Creating minimal version...${NC}"
  cat > .env << EOL
# Essential configuration for development
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ashes_dev
MILVUS_USER=milvus_user
MILVUS_PASSWORD=milvus_password
REDIS_PASSWORD=redis_password
OPENAI_API_KEY=sk-dummy-key-for-development
NEXT_PUBLIC_API_URL=/api
GAME_SERVERS=Alpha-1,Alpha-2
DEBUG=true
LOG_LEVEL=debug
EOL
  echo -e "${GREEN}Created minimal .env file for development${NC}"
fi

# Restart containers with new configuration
echo -e "\n${BOLD}Starting containers with fixed configuration...${NC}"
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml up -d

echo -e "\n${BOLD}${BLUE}=== Fix Complete ===${NC}"
echo -e "Containers should now be starting with fixed configurations."
echo -e "Use ${YELLOW}./diagnose.sh${NC} to check the current status."
echo -e "Use ${YELLOW}./logs.sh [service]${NC} to view specific container logs."
