# MyAshes.ai Docker Development Environment

This folder contains Docker configurations and utility scripts for setting up and managing the MyAshes.ai development environment.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- Git (for cloning the repository)
- Basic knowledge of terminal/command-line operations

## Quick Start

1. Make all scripts executable (Linux/MacOS):
   ```bash
   chmod +x *.sh
   ```

2. Start the development environment:
   ```bash
   ./dev-start.sh
   ```
   This script sets up everything needed for development, including creating default configurations.

3. Access the application:
   - Frontend: http://localhost:80
   - API: http://localhost:80/api
   - Milvus UI: http://localhost:9091

## Available Scripts

### `dev-start.sh`

The primary script for setting up and starting the development environment.

- Creates necessary directories and default files
- Checks for `.env` file and creates one from `.env.example` if needed
- Sets proper permissions for entrypoint scripts
- Starts containers in the correct order with dependency handling
- Provides helpful information after startup

### `diagnose.sh`

A diagnostic tool that helps identify issues with containers.

```bash
./diagnose.sh
```

This script:
- Shows the status of all containers
- Analyzes failing containers and shows relevant error messages
- Checks network connectivity between containers
- Verifies environment configuration
- Provides recommendations for fixing common issues

### `logs.sh`

A utility for viewing container logs.

```bash
./logs.sh [service] [lines]
```

Examples:
- `./logs.sh backend` - View backend logs
- `./logs.sh backend 100` - View last 100 lines of backend logs
- `./logs.sh all` - View logs from all services

### `fix-docker.sh`

A script to fix common Docker environment issues.

```bash
./fix-docker.sh
```

This script:
- Stops all containers
- Optionally prunes unused volumes
- Fixes entrypoint script permissions
- Rebuilds containers
- Starts containers in the correct order

### `reload.sh`

A utility script for rapid development testing.

```bash
./reload.sh
```

## Common Development Workflows

### First-Time Setup

```bash
# Initial setup of development environment
./dev-start.sh

# If you encounter issues, diagnose them
./diagnose.sh
```

### Daily Development

```bash
# Start the environment (if not already running)
./dev-start.sh

# View logs for specific components
./logs.sh frontend
./logs.sh backend

# When making code changes, most services will auto-reload
# If auto-reload doesn't work, restart the specific service:
docker-compose restart backend
```

### Working with Data

```bash
# Connect to PostgreSQL database
docker-compose exec postgres psql -U postgres -d ashes_dev

# View Milvus vector database through UI
# Open http://localhost:9091 in your browser
```

### Troubleshooting

If you encounter issues:

1. Run the diagnostics script:
   ```bash
   ./diagnose.sh
   ```

2. Check logs for specific services:
   ```bash
   ./logs.sh milvus-standalone
   ./logs.sh backend
   ./logs.sh nginx
   ```

3. Try fixing common issues:
   ```bash
   ./fix-docker.sh
   ```

4. If all else fails, completely rebuild the environment:
   ```bash
   docker-compose down -v
   ./dev-start.sh
   ```

## Docker Compose Configuration

The setup uses three Docker Compose files:

1. `docker-compose.yml` - Main configuration with all services
2. `docker-compose.dev.yml` - Development-specific overrides
3. `docker-compose.prod.yml` - Production-specific optimizations

For development, we use the first two:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Environment Configuration

The `.env` file contains all necessary configuration values. Important variables include:

- `OPENAI_API_KEY` - Required for LLM functionality
- `POSTGRES_USER`, `POSTGRES_PASSWORD` - Database credentials
- `MILVUS_USER`, `MILVUS_PASSWORD` - Vector database credentials
- `REDIS_PASSWORD` - Cache password

## Service Architecture

The development environment consists of:

- **Frontend** (Next.js) - Port 3000
- **Backend** (FastAPI) - Port 8000
- **Nginx** - Port 80 (routes to frontend and backend)
- **PostgreSQL** - Port 5432
- **Milvus** - Port 19530 (vector database)
- **Redis** - Port 6379 (caching)
- **Data Pipeline** - (data extraction and processing)

## Volumes and Data Persistence

Docker volumes are used to persist data:

- `postgres-data` - Database files
- `milvus-data` - Vector database files
- `redis-data` - Cache data
- `game-data` - Extracted game data

To clean all data and start fresh:

```bash
docker-compose down -v
docker volume prune -f
```

## Extending the Environment

To add a new service:

1. Add the service configuration to `docker-compose.yml`
2. Add development overrides to `docker-compose.dev.yml`
3. Update scripts as needed
4. Rebuild and restart the environment

## Common Issues and Solutions

### Container Keeps Restarting

This usually indicates a startup error or dependency issue:

```bash
./diagnose.sh
./logs.sh [container_name]
```

### Database Connection Issues

Ensure PostgreSQL is running and credentials are correct:

```bash
docker-compose ps postgres
./logs.sh postgres
```

### Milvus Connection Issues

Milvus requires proper setup with etcd and MinIO:

```bash
./logs.sh milvus-standalone
./logs.sh etcd
./logs.sh minio
```

### Frontend Not Loading

Check nginx configuration and frontend service:

```bash
./logs.sh nginx
./logs.sh frontend
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Milvus Documentation](https://milvus.io/docs)
