#!/bin/bash

# Define the directory paths
REPO_DIR=$(pwd)/..
DOCKER_DIR="$REPO_DIR/docker"

# Function to perform a fast reload
fast_reload() {
    echo "Performing fast reload..."
    cd "$REPO_DIR" || exit
    git pull
    cd "$DOCKER_DIR" || exit
    docker compose up --build -d
}

# Function to perform a full reload
full_reload() {
    echo "Performing full reload..."
    cd "$DOCKER_DIR" || exit
    docker compose down -v
    cd "$REPO_DIR" || exit
    git pull
    cd "$DOCKER_DIR" || exit
    docker compose up --build -d
}

# Check for optional argument
if [ "$1" == "--full" ]; then
    full_reload
else
    fast_reload
fi
