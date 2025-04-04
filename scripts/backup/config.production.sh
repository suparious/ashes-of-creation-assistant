#!/bin/bash

# Database Connection Details
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="myashes_production"
DB_USER="myashes"
DB_PASSWORD="change_me_in_actual_config"  # Use environment variable in production

# S3 Backup Configuration
S3_BUCKET="myashes-backups"
AWS_REGION="us-east-1"

# Vector Database Configuration
VECTOR_DB_TYPE="milvus"
VECTOR_DB_HOST="milvus"
VECTOR_DB_PORT="19530"

# Notification Webhook (Slack or other service)
NOTIFICATION_WEBHOOK="https://hooks.slack.com/services/your/webhook/url"
