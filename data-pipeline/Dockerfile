FROM nvidia/cuda:12.2.0-base-ubuntu22.04

WORKDIR /app

# Install Python and dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip git wget curl unzip netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app /app

# Create data directory
RUN mkdir -p /data

# Copy and set permissions for entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set up default environment variables
ENV SCRAPE_INTERVAL=86400
ENV MILVUS_HOST=milvus-standalone
ENV MILVUS_PORT=19530
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432

# Expose port for monitoring (optional)
EXPOSE 8501

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
