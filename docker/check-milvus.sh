#!/bin/bash

# Script to check Milvus container in detail

# Text styling
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}=== Milvus Container Diagnostics ===${NC}\n"

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

# Check if Milvus container exists
MILVUS_CONTAINER_ID=$(docker ps -a --filter name=milvus-standalone --format "{{.ID}}")

if [ -z "$MILVUS_CONTAINER_ID" ]; then
    echo -e "${RED}No Milvus container found. Make sure it's created.${NC}"
    exit 1
fi

# Get Milvus container status
MILVUS_STATUS=$(docker inspect --format="{{.State.Status}}" $MILVUS_CONTAINER_ID)
echo -e "Milvus container status: ${YELLOW}$MILVUS_STATUS${NC}"

# Check Milvus container logs
echo -e "\n${BOLD}Last 20 log lines:${NC}"
docker logs --tail 20 $MILVUS_CONTAINER_ID

# Check for common errors
echo -e "\n${BOLD}${BLUE}Checking for common errors:${NC}"

# Check for permission issues
if docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "permission denied"; then
    echo -e "${RED}Permission issues detected!${NC}"
    docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "permission denied" | head -5
fi

# Check for connection issues
if docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "connection refused"; then
    echo -e "${RED}Connection issues detected!${NC}"
    docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "connection refused" | head -5
fi

# Check for etcd issues
if docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "etcd"; then
    echo -e "${YELLOW}Etcd-related messages:${NC}"
    docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "etcd" | tail -5
fi

# Check for MinIO issues
if docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "minio"; then
    echo -e "${YELLOW}MinIO-related messages:${NC}"
    docker logs $MILVUS_CONTAINER_ID 2>&1 | grep -i "minio" | tail -5
fi

# Check environment variables
echo -e "\n${BOLD}${BLUE}Checking Milvus environment variables:${NC}"
docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' $MILVUS_CONTAINER_ID | grep -i "MILVUS\|ETCD\|COMMON\|MINI"

# Check volumes
echo -e "\n${BOLD}${BLUE}Checking Milvus volumes:${NC}"
docker inspect --format='{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println ""}}{{end}}' $MILVUS_CONTAINER_ID

# Check etcd container
ETCD_CONTAINER_ID=$(docker ps -a --filter name=etcd --format "{{.ID}}")
if [ -n "$ETCD_CONTAINER_ID" ]; then
    ETCD_STATUS=$(docker inspect --format="{{.State.Status}}" $ETCD_CONTAINER_ID)
    echo -e "\n${BOLD}${BLUE}Etcd container status:${NC} ${YELLOW}$ETCD_STATUS${NC}"
    
    if [ "$ETCD_STATUS" != "running" ]; then
        echo -e "${RED}Etcd container is not running!${NC}"
        echo -e "Last 5 log lines from etcd:"
        docker logs --tail 5 $ETCD_CONTAINER_ID
    fi
fi

# Check MinIO container
MINIO_CONTAINER_ID=$(docker ps -a --filter name=minio --format "{{.ID}}")
if [ -n "$MINIO_CONTAINER_ID" ]; then
    MINIO_STATUS=$(docker inspect --format="{{.State.Status}}" $MINIO_CONTAINER_ID)
    echo -e "\n${BOLD}${BLUE}MinIO container status:${NC} ${YELLOW}$MINIO_STATUS${NC}"
    
    if [ "$MINIO_STATUS" != "running" ]; then
        echo -e "${RED}MinIO container is not running!${NC}"
        echo -e "Last 5 log lines from MinIO:"
        docker logs --tail 5 $MINIO_CONTAINER_ID
    fi
fi

echo -e "\n${BOLD}${BLUE}=== Recommendations for Milvus Issues ===${NC}"
echo -e "1. Check that etcd and MinIO containers are running properly"
echo -e "2. Verify Milvus authentication settings (username/password)"
echo -e "3. Ensure volume permissions are correct"
echo -e "4. Try re-creating the Milvus container: docker-compose up -d --force-recreate milvus-standalone"
echo -e "5. If issues persist, try pruning volumes: docker-compose down -v && docker volume prune -f"
