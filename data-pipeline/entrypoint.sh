#!/bin/sh

# Wait for Milvus to be available (optional based on dependencies)
if [ "$MILVUS_HOST" != "" ]; then
  echo "Waiting for Milvus to start..."
  # Simple connection test - just try to connect to the port
  timeout=60
  counter=0
  while ! nc -z $MILVUS_HOST $MILVUS_PORT && [ $counter -lt $timeout ]; do
    sleep 1
    counter=$((counter+1))
    echo "Still waiting for Milvus ($counter/$timeout)..."
  done
  
  if [ $counter -lt $timeout ]; then
    echo "Milvus started"
  else
    echo "Warning: Timed out waiting for Milvus, but continuing anyway"
  fi
fi

# Wait for PostgreSQL to be available (if needed)
if [ "$POSTGRES_HOST" != "" ]; then
  echo "Waiting for PostgreSQL to start..."
  timeout=30
  counter=0
  while ! nc -z $POSTGRES_HOST $POSTGRES_PORT && [ $counter -lt $timeout ]; do
    sleep 1
    counter=$((counter+1))
    echo "Still waiting for PostgreSQL ($counter/$timeout)..."
  done
  
  if [ $counter -lt $timeout ]; then
    echo "PostgreSQL started"
  else
    echo "Warning: Timed out waiting for PostgreSQL, but continuing anyway"
  fi
fi

# Wait for Redis to be available (if needed)
if [ "$REDIS_HOST" != "" ]; then
  echo "Waiting for Redis to start..."
  timeout=30
  counter=0
  while ! nc -z $REDIS_HOST $REDIS_PORT && [ $counter -lt $timeout ]; do
    sleep 1
    counter=$((counter+1))
    echo "Still waiting for Redis ($counter/$timeout)..."
  done
  
  if [ $counter -lt $timeout ]; then
    echo "Redis started"
  else
    echo "Warning: Timed out waiting for Redis, but continuing anyway"
  fi
fi

# Start the data pipeline
echo "Starting data pipeline..."
exec python3 /app/main.py
