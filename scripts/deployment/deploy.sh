#!/bin/bash
set -e

# MyAshes.ai Deployment Script
# This script can be used to manually deploy the application to a server

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-staging}  # Default to staging if no environment specified
TIMESTAMP=$(date +%Y%m%d%H%M%S)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
CONFIG_FILE="$REPO_ROOT/scripts/deployment/config.${ENV}.sh"

echo -e "${YELLOW}Starting deployment to ${ENV} environment...${NC}"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}Loading configuration from $CONFIG_FILE${NC}"
    source "$CONFIG_FILE"
else
    echo -e "${RED}Error: Configuration file $CONFIG_FILE not found${NC}"
    echo -e "Please create this file with the following variables:"
    echo -e "SSH_USER=your_ssh_user"
    echo -e "SSH_HOST=your_server_hostname"
    echo -e "DEPLOY_PATH=/path/to/deployment/directory"
    echo -e "DOCKER_REGISTRY=your_docker_registry (e.g., ghcr.io/your-username)"
    exit 1
fi

# Check required variables
for VAR in SSH_USER SSH_HOST DEPLOY_PATH DOCKER_REGISTRY; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}Error: $VAR is not set in config file${NC}"
        exit 1
    fi
done

# Get git commit information
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

echo -e "${YELLOW}Deployment details:${NC}"
echo -e "  Environment: ${ENV}"
echo -e "  Server: ${SSH_HOST}"
echo -e "  Commit: ${GIT_COMMIT}"
echo -e "  Branch: ${GIT_BRANCH}"
echo -e "  Timestamp: ${TIMESTAMP}"

# Confirm deployment
read -p "Do you want to continue with the deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Build docker images
echo -e "${YELLOW}Building Docker images...${NC}"

FRONTEND_IMAGE="${DOCKER_REGISTRY}/myashes-frontend:${ENV}-${TIMESTAMP}-${GIT_COMMIT}"
BACKEND_IMAGE="${DOCKER_REGISTRY}/myashes-backend:${ENV}-${TIMESTAMP}-${GIT_COMMIT}"
DATA_PIPELINE_IMAGE="${DOCKER_REGISTRY}/myashes-data-pipeline:${ENV}-${TIMESTAMP}-${GIT_COMMIT}"

docker build -t "${FRONTEND_IMAGE}" "${REPO_ROOT}/frontend"
docker build -t "${BACKEND_IMAGE}" "${REPO_ROOT}/backend"
docker build -t "${DATA_PIPELINE_IMAGE}" "${REPO_ROOT}/data-pipeline"

# Push images to registry
echo -e "${YELLOW}Pushing images to registry...${NC}"
docker push "${FRONTEND_IMAGE}"
docker push "${BACKEND_IMAGE}"
docker push "${DATA_PIPELINE_IMAGE}"

# Create deployment directory on server
echo -e "${YELLOW}Preparing server...${NC}"
ssh "${SSH_USER}@${SSH_HOST}" "mkdir -p ${DEPLOY_PATH}/${ENV}"

# Copy docker-compose files
echo -e "${YELLOW}Copying deployment files...${NC}"
scp "${REPO_ROOT}/docker/docker-compose.yml" "${REPO_ROOT}/docker/docker-compose.${ENV}.yml" "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/${ENV}/"

# Generate .env file
echo -e "${YELLOW}Generating .env file...${NC}"
cat > .env.tmp << EOF
FRONTEND_IMAGE=${FRONTEND_IMAGE}
BACKEND_IMAGE=${BACKEND_IMAGE}
DATA_PIPELINE_IMAGE=${DATA_PIPELINE_IMAGE}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-myashes}
REDIS_PASSWORD=${REDIS_PASSWORD:-redis}
OPENAI_API_KEY=${OPENAI_API_KEY}
JWT_SECRET=${JWT_SECRET:-changeme}
ENVIRONMENT=${ENV}
DOMAIN=${DOMAIN:-localhost}
DEPLOYMENT_TIMESTAMP=${TIMESTAMP}
DEPLOYMENT_COMMIT=${GIT_COMMIT}
DEPLOYMENT_BRANCH=${GIT_BRANCH}
EOF

# Transfer .env file
scp .env.tmp "${SSH_USER}@${SSH_HOST}:${DEPLOY_PATH}/${ENV}/.env"
rm .env.tmp

# Deploy the application
echo -e "${YELLOW}Deploying application...${NC}"
ssh "${SSH_USER}@${SSH_HOST}" "cd ${DEPLOY_PATH}/${ENV} && docker compose -f docker-compose.yml -f docker-compose.${ENV}.yml pull && docker compose -f docker-compose.yml -f docker-compose.${ENV}.yml up -d"

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
ssh "${SSH_USER}@${SSH_HOST}" "cd ${DEPLOY_PATH}/${ENV} && docker compose -f docker-compose.yml -f docker-compose.${ENV}.yml exec -T backend alembic upgrade head"

# Wait for health checks
echo -e "${YELLOW}Waiting for services to become healthy...${NC}"
ssh "${SSH_USER}@${SSH_HOST}" "cd ${DEPLOY_PATH}/${ENV} && docker compose -f docker-compose.yml -f docker-compose.${ENV}.yml ps | grep -q 'healthy' || (sleep 30 && docker compose -f docker-compose.yml -f docker-compose.${ENV}.yml ps | grep -q 'healthy')"

# Create deployment record
echo -e "${YELLOW}Recording deployment...${NC}"
DEPLOY_RECORD=$(cat << EOF
{
  "environment": "${ENV}",
  "timestamp": "${TIMESTAMP}",
  "git_commit": "${GIT_COMMIT}",
  "git_branch": "${GIT_BRANCH}",
  "frontend_image": "${FRONTEND_IMAGE}",
  "backend_image": "${BACKEND_IMAGE}",
  "data_pipeline_image": "${DATA_PIPELINE_IMAGE}",
  "deployed_by": "$(whoami)",
  "deployed_from": "$(hostname)"
}
EOF
)

ssh "${SSH_USER}@${SSH_HOST}" "echo '${DEPLOY_RECORD}' > ${DEPLOY_PATH}/${ENV}/deployment-${TIMESTAMP}.json"

# Clean up old deployments (keep last 5)
echo -e "${YELLOW}Cleaning up old deployment records...${NC}"
ssh "${SSH_USER}@${SSH_HOST}" "cd ${DEPLOY_PATH}/${ENV} && ls -t deployment-*.json | tail -n +6 | xargs -r rm"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "Application is now available at: https://${DOMAIN:-$ENV.$SSH_HOST}"
