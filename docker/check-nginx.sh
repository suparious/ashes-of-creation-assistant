#!/bin/bash

# Script to check Nginx container in detail

# Text styling
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}=== Nginx Container Diagnostics ===${NC}\n"

# Check if docker command is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker-compose command is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}docker-compose command not found. Using 'docker compose' instead...${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if Nginx container exists
NGINX_CONTAINER_ID=$(docker ps -a --filter name=nginx --format "{{.ID}}")

if [ -z "$NGINX_CONTAINER_ID" ]; then
    echo -e "${RED}No Nginx container found. Make sure it's created.${NC}"
    exit 1
fi

# Get Nginx container status
NGINX_STATUS=$(docker inspect --format="{{.State.Status}}" $NGINX_CONTAINER_ID)
echo -e "Nginx container status: ${YELLOW}$NGINX_STATUS${NC}"

# Check Nginx container logs
echo -e "\n${BOLD}Last 20 log lines:${NC}"
docker logs --tail 20 $NGINX_CONTAINER_ID

# Check for common errors
echo -e "\n${BOLD}${BLUE}Checking for common errors:${NC}"

# Check for SSL certificate issues
if docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "ssl certificate"; then
    echo -e "${RED}SSL certificate issues detected!${NC}"
    docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "ssl certificate" | head -5
fi

# Check for configuration issues
if docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "emerg\|error"; then
    echo -e "${RED}Configuration errors detected!${NC}"
    docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "emerg\|error" | head -5
fi

# Check for permission issues
if docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "permission denied"; then
    echo -e "${RED}Permission issues detected!${NC}"
    docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "permission denied" | head -5
fi

# Check for connection issues with backend services
if docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "connect() failed"; then
    echo -e "${RED}Connection issues with backend services detected!${NC}"
    docker logs $NGINX_CONTAINER_ID 2>&1 | grep -i "connect() failed" | head -5
fi

# Check Nginx configuration
echo -e "\n${BOLD}${BLUE}Testing Nginx configuration:${NC}"
docker exec $NGINX_CONTAINER_ID nginx -t 2>&1 || echo -e "${RED}Nginx configuration test failed!${NC}"

# Check Nginx configuration files
echo -e "\n${BOLD}${BLUE}Nginx configuration files:${NC}"
docker exec $NGINX_CONTAINER_ID find /etc/nginx/conf.d -type f -name "*.conf" -exec echo {} \; -exec cat {} \; 2>/dev/null || echo -e "${RED}Could not read Nginx configuration files!${NC}"

# Check volumes
echo -e "\n${BOLD}${BLUE}Checking Nginx volumes:${NC}"
docker inspect --format='{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println ""}}{{end}}' $NGINX_CONTAINER_ID

# Check directory structure in important locations
echo -e "\n${BOLD}${BLUE}Checking SSL directory:${NC}"
docker exec $NGINX_CONTAINER_ID ls -la /etc/nginx/ssl 2>/dev/null || echo -e "${YELLOW}SSL directory not found or empty${NC}"

echo -e "\n${BOLD}${BLUE}Checking conf.d directory:${NC}"
docker exec $NGINX_CONTAINER_ID ls -la /etc/nginx/conf.d 2>/dev/null || echo -e "${RED}conf.d directory not found!${NC}"

echo -e "\n${BOLD}${BLUE}Checking www directory:${NC}"
docker exec $NGINX_CONTAINER_ID ls -la /var/www/html 2>/dev/null || echo -e "${YELLOW}www directory not found or empty${NC}"

# Check backend service status
BACKEND_CONTAINER_ID=$(docker ps -a --filter name=backend --format "{{.ID}}")
if [ -n "$BACKEND_CONTAINER_ID" ]; then
    BACKEND_STATUS=$(docker inspect --format="{{.State.Status}}" $BACKEND_CONTAINER_ID)
    echo -e "\n${BOLD}${BLUE}Backend container status:${NC} ${YELLOW}$BACKEND_STATUS${NC}"
    
    if [ "$BACKEND_STATUS" != "running" ]; then
        echo -e "${RED}Backend container is not running!${NC}"
    fi
fi

# Check frontend service status
FRONTEND_CONTAINER_ID=$(docker ps -a --filter name=frontend --format "{{.ID}}")
if [ -n "$FRONTEND_CONTAINER_ID" ]; then
    FRONTEND_STATUS=$(docker inspect --format="{{.State.Status}}" $FRONTEND_CONTAINER_ID)
    echo -e "\n${BOLD}${BLUE}Frontend container status:${NC} ${YELLOW}$FRONTEND_STATUS${NC}"
    
    if [ "$FRONTEND_STATUS" != "running" ]; then
        echo -e "${RED}Frontend container is not running!${NC}"
    fi
fi

echo -e "\n${BOLD}${BLUE}=== Recommendations for Nginx Issues ===${NC}"
echo -e "1. If SSL certificate issues: Use development config without SSL or create self-signed certs"
echo -e "2. If connection issues: Ensure backend and frontend services are running"
echo -e "3. Fix configuration file path problems if detected"
echo -e "4. Check for typos in server_name or service names"
echo -e "5. Try using the development configuration: myashes.dev.conf"
echo -e "6. For quick testing, run: docker-compose exec nginx nginx -t"
