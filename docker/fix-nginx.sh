#!/bin/bash

# This script only fixes the Nginx configuration without other arbitrary changes

# Create necessary directories
mkdir -p ../nginx/www
mkdir -p ../nginx/ssl

# Create minimal error pages if they don't exist
if [ ! -f "../nginx/www/404.html" ]; then
    cat > ../nginx/www/404.html << EOL
<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { font-size: 36px; margin-bottom: 20px; }
        p { font-size: 18px; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <p><a href="/">Return to home</a></p>
</body>
</html>
EOL
    echo "Created 404.html error page"
fi

if [ ! -f "../nginx/www/50x.html" ]; then
    cat > ../nginx/www/50x.html << EOL
<!DOCTYPE html>
<html>
<head>
    <title>Server Error</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { font-size: 36px; margin-bottom: 20px; }
        p { font-size: 18px; }
    </style>
</head>
<body>
    <h1>Server Error</h1>
    <p>Sorry, something went wrong on our end.</p>
    <p><a href="/">Return to home</a></p>
</body>
</html>
EOL
    echo "Created 50x.html error page"
fi

# Make sure we have a dev configuration
if [ ! -f "../nginx/conf/default.conf" ]; then
    # Copy from the dev config we created
    if [ -f "../nginx/conf/myashes.dev.conf" ]; then
        cp ../nginx/conf/myashes.dev.conf ../nginx/conf/default.conf
        echo "Created default.conf from myashes.dev.conf"
    else
        # Create a minimal default config
        cat > ../nginx/conf/default.conf << EOL
server {
    listen 80;
    server_name localhost;
    server_tokens off;

    # Proxy requests to frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;  # Longer timeout for API responses
    }

    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /404.html {
        root /var/www/html;
        internal;
    }
    location = /50x.html {
        root /var/www/html;
        internal;
    }
}
EOL
        echo "Created minimal default.conf"
    fi
fi

# Restart just the nginx container
echo "Restarting nginx container..."
docker-compose restart nginx

echo "Nginx configuration fixed. Check status with: docker-compose ps nginx"
