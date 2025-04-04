#!/bin/bash
set -e

# MyAshes.ai Monitoring Setup Script
# This script sets up Prometheus, Grafana, and node-exporter for monitoring

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
MONITORING_PATH=${1:-/opt/monitoring}
GRAFANA_VERSION=${2:-9.5.3}
PROMETHEUS_VERSION=${3:-2.44.0}
NODE_EXPORTER_VERSION=${4:-1.5.0}

echo -e "${YELLOW}Setting up monitoring stack at ${MONITORING_PATH}...${NC}"

# Create directories
echo -e "${GREEN}Creating directories...${NC}"
sudo mkdir -p ${MONITORING_PATH}/{prometheus,grafana,node-exporter,alertmanager}/data
sudo mkdir -p ${MONITORING_PATH}/{prometheus,grafana,node-exporter,alertmanager}/config

# Create prometheus configuration
echo -e "${GREEN}Creating Prometheus configuration...${NC}"
cat > /tmp/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
  
  - job_name: 'backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:8000']
EOF

sudo mv /tmp/prometheus.yml ${MONITORING_PATH}/prometheus/config/prometheus.yml

# Create alert rules
echo -e "${GREEN}Creating Prometheus alert rules...${NC}"
sudo mkdir -p ${MONITORING_PATH}/prometheus/config/rules

cat > /tmp/node_alerts.yml << EOF
groups:
- name: node_alerts
  rules:
  - alert: HighCPULoad
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU load (instance {{ \$labels.instance }})"
      description: "CPU load is > 80%\n  VALUE = {{ \$value }}\n  LABELS: {{ \$labels }}"
  
  - alert: HighMemoryLoad
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory load (instance {{ \$labels.instance }})"
      description: "Memory load is > 85%\n  VALUE = {{ \$value }}\n  LABELS: {{ \$labels }}"
      
  - alert: HighDiskUsage
    expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High disk usage (instance {{ \$labels.instance }})"
      description: "Disk usage is > 85%\n  VALUE = {{ \$value }}\n  LABELS: {{ \$labels }}"
EOF

sudo mv /tmp/node_alerts.yml ${MONITORING_PATH}/prometheus/config/rules/node_alerts.yml

# Create alertmanager configuration
echo -e "${GREEN}Creating Alertmanager configuration...${NC}"
cat > /tmp/alertmanager.yml << EOF
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/your/slack/webhook'

route:
  group_by: ['alertname', 'job']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    send_resolved: true
    title: "{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}"
    text: "{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}"

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
EOF

sudo mv /tmp/alertmanager.yml ${MONITORING_PATH}/alertmanager/config/alertmanager.yml

# Create docker-compose file
echo -e "${GREEN}Creating docker-compose file...${NC}"
cat > /tmp/docker-compose.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v${PROMETHEUS_VERSION}
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ${MONITORING_PATH}/prometheus/config:/etc/prometheus
      - ${MONITORING_PATH}/prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v${NODE_EXPORTER_VERSION}
    container_name: node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager
    container_name: alertmanager
    restart: unless-stopped
    volumes:
      - ${MONITORING_PATH}/alertmanager/config:/etc/alertmanager
      - ${MONITORING_PATH}/alertmanager/data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:${GRAFANA_VERSION}
    container_name: grafana
    restart: unless-stopped
    volumes:
      - ${MONITORING_PATH}/grafana/data:/var/lib/grafana
      - ${MONITORING_PATH}/grafana/config:/etc/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin_password_change_me
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: unless-stopped
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - "8080:8080"
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge
EOF

sudo mv /tmp/docker-compose.yml ${MONITORING_PATH}/docker-compose.yml

# Set permissions
echo -e "${GREEN}Setting permissions...${NC}"
sudo chown -R 65534:65534 ${MONITORING_PATH}/prometheus/data
sudo chown -R 472:472 ${MONITORING_PATH}/grafana/data

# Start the monitoring stack
echo -e "${GREEN}Starting monitoring stack...${NC}"
cd ${MONITORING_PATH}
sudo docker compose up -d

echo -e "${GREEN}Monitoring stack setup completed!${NC}"
echo -e "Prometheus: http://localhost:9090"
echo -e "Grafana: http://localhost:3000 (admin/admin_password_change_me)"
echo -e "Node Exporter: http://localhost:9100/metrics"
echo -e "AlertManager: http://localhost:9093"
echo
echo -e "${YELLOW}Important: Please change the default Grafana password immediately!${NC}"
