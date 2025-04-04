#!/bin/bash
set -e

# MyAshes.ai Database Backup Script
# This script creates a backup of the application's database and uploads it to cloud storage

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-production}
BACKUP_DIR=${2:-/opt/myashes/backups}
RETENTION_DAYS=${3:-14}
CONFIG_FILE="$(dirname "$0")/config.${ENV}.sh"

# Load environment configuration
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}Loading configuration from $CONFIG_FILE${NC}"
    source "$CONFIG_FILE"
else
    echo -e "${RED}Error: Configuration file $CONFIG_FILE not found${NC}"
    echo -e "Please create this file with database connection details"
    exit 1
fi

# Check required variables
for VAR in DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}Error: $VAR is not set in config file${NC}"
        exit 1
    fi
done

# Create timestamp for the backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${ENV}_${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}Starting database backup for ${ENV} environment...${NC}"
echo -e "  Database: ${DB_NAME}"
echo -e "  Timestamp: ${TIMESTAMP}"
echo -e "  Backup file: ${BACKUP_FILE}"

# Create the database backup
echo -e "${GREEN}Creating database backup...${NC}"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    --clean \
    --create \
    --format=custom \
    | gzip > "${BACKUP_FILE}"

# Check backup file size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo -e "${GREEN}Backup completed. File size: ${BACKUP_SIZE}${NC}"

# Upload to cloud storage if configured
if [ -n "${S3_BUCKET}" ]; then
    echo -e "${GREEN}Uploading backup to S3...${NC}"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not installed. Skipping S3 upload.${NC}"
    else
        # Upload the backup
        aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/${ENV}/database/${ENV}_${DB_NAME}_${TIMESTAMP}.sql.gz"
        echo -e "${GREEN}Backup uploaded to S3://${S3_BUCKET}/${ENV}/database/${ENV}_${DB_NAME}_${TIMESTAMP}.sql.gz${NC}"
    fi
fi

# Clean up old backups
echo -e "${GREEN}Cleaning up old backups (keeping ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "${ENV}_${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Create symlink to latest backup
ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/${ENV}_${DB_NAME}_latest.sql.gz"

echo -e "${GREEN}Backup process completed successfully!${NC}"

# Export Vector Database if configured
if [ -n "${VECTOR_DB_HOST}" ] && [ -n "${VECTOR_DB_PORT}" ]; then
    echo -e "${YELLOW}Starting vector database export...${NC}"
    
    VECTOR_BACKUP_FILE="${BACKUP_DIR}/${ENV}_vectordb_${TIMESTAMP}.tar.gz"
    
    # Run the export command (assuming Milvus)
    # This is a simplified example and should be adjusted based on your vector DB
    if [ "${VECTOR_DB_TYPE}" == "milvus" ]; then
        echo -e "${GREEN}Exporting Milvus collections...${NC}"
        # This is a placeholder - you need to use the appropriate Milvus backup tool
        # milvus_backup -h "${VECTOR_DB_HOST}" -p "${VECTOR_DB_PORT}" -o "${VECTOR_BACKUP_FILE}"
        echo -e "${YELLOW}Milvus backup command is a placeholder. Please implement the actual backup command.${NC}"
    else
        echo -e "${YELLOW}Vector database backup not configured for type: ${VECTOR_DB_TYPE}${NC}"
    fi
    
    # Upload vector DB backup to S3 if it was created
    if [ -f "${VECTOR_BACKUP_FILE}" ] && [ -n "${S3_BUCKET}" ]; then
        echo -e "${GREEN}Uploading vector database backup to S3...${NC}"
        aws s3 cp "${VECTOR_BACKUP_FILE}" "s3://${S3_BUCKET}/${ENV}/vectordb/${ENV}_vectordb_${TIMESTAMP}.tar.gz"
    fi
fi

# Send notification
if [ -n "${NOTIFICATION_WEBHOOK}" ]; then
    echo -e "${GREEN}Sending backup notification...${NC}"
    
    # Create JSON payload
    PAYLOAD=$(cat << EOF
{
  "text": "Database backup completed",
  "attachments": [
    {
      "color": "good",
      "fields": [
        {
          "title": "Environment",
          "value": "${ENV}",
          "short": true
        },
        {
          "title": "Database",
          "value": "${DB_NAME}",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "${TIMESTAMP}",
          "short": true
        },
        {
          "title": "Size",
          "value": "${BACKUP_SIZE}",
          "short": true
        }
      ]
    }
  ]
}
EOF
)
    
    # Send webhook
    curl -s -X POST -H "Content-Type: application/json" -d "${PAYLOAD}" "${NOTIFICATION_WEBHOOK}"
fi

exit 0
