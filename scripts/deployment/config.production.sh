#!/bin/bash

# MyAshes.ai Production Deployment Configuration

# SSH Connection Details
SSH_USER="deploy"
SSH_HOST="myashes.ai"
DEPLOY_PATH="/opt/myashes"

# Docker Registry
DOCKER_REGISTRY="ghcr.io/myashes-ai"

# Database Configuration
POSTGRES_USER="myashes"
POSTGRES_PASSWORD="placeholder_replace_with_env_var"  # Should be set via environment variable
POSTGRES_DB="myashes_production"

# Redis Configuration
REDIS_PASSWORD="placeholder_replace_with_env_var"  # Should be set via environment variable

# Domain Configuration
DOMAIN="myashes.ai"

# API Keys (Should be set in environment variables in actual deployment)
OPENAI_API_KEY="placeholder_replace_with_env_var"
JWT_SECRET="placeholder_replace_with_env_var"
