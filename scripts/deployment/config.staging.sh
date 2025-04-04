#!/bin/bash

# MyAshes.ai Staging Deployment Configuration

# SSH Connection Details
SSH_USER="deploy"
SSH_HOST="staging.myashes.ai"
DEPLOY_PATH="/opt/myashes"

# Docker Registry
DOCKER_REGISTRY="ghcr.io/myashes-ai"

# Database Configuration
POSTGRES_USER="myashes"
POSTGRES_PASSWORD="change_me_in_production"  # Better to use environment variable in actual deployment
POSTGRES_DB="myashes_staging"

# Redis Configuration
REDIS_PASSWORD="change_me_in_production"  # Better to use environment variable in actual deployment

# Domain Configuration
DOMAIN="staging.myashes.ai"

# API Keys (Should be set in environment variables in actual deployment)
OPENAI_API_KEY="placeholder_replace_with_env_var"
JWT_SECRET="placeholder_replace_with_env_var"
