# MyAshes.ai Backend - Kubernetes Deployment

AI-powered assistant backend for Ashes of Creation MMORPG, deployed on SRT-HQ Kubernetes platform.

## Quick Start

```powershell
# Deploy to Kubernetes (recommended)
.\deploy.ps1 -Build -Push

# Just deploy (use existing image)
.\deploy.ps1

# Uninstall
.\deploy.ps1 -Uninstall
```

## Architecture

- **Application**: FastAPI backend with ML/AI capabilities
- **Frontend**: Deployed separately to GitHub Pages (myashes.ai)
- **Database**: Platform PostgreSQL CNPG cluster
- **Vector DB**: Platform Milvus (in data tier)
- **AI Inference**: Platform vLLM (via Artemis proxy)
- **External Access**: myashes.ai → Artemis → myashes-backend.lab.hq.solidrust.net

## Development

### Local Development

```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL="postgresql://user:pass@localhost/myashes"
export SECRET_KEY="dev-secret-key"
alembic upgrade head
uvicorn app.main:app --reload
```

Access:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Docker Build

```powershell
# Build locally
.\build-and-push.ps1

# Build and push to Docker Hub
.\build-and-push.ps1 -Login -Push

# Test image
docker run --rm -p 8000:8000 `
  -e DATABASE_URL="postgresql://..." `
  -e SECRET_KEY="test-key" `
  suparious/myashes-backend:latest
```

## Kubernetes Deployment

### Prerequisites

1. **PostgreSQL Database**: Create database in platform CNPG cluster
   ```sql
   kubectl cnpg psql postgres-cluster postgres-system
   CREATE DATABASE myashes;
   GRANT ALL PRIVILEGES ON DATABASE myashes TO myashes;
   ```

2. **Update Secrets**: Before first deployment
   ```bash
   kubectl create secret generic myashes-backend-secrets \
     -n myashes-backend \
     --from-literal=POSTGRES_USER=myashes \
     --from-literal=POSTGRES_PASSWORD='your-strong-password' \
     --from-literal=SECRET_KEY='your-jwt-secret' \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Milvus**: Ensure platform Milvus is deployed in data tier

### Deploy

```powershell
# Full deployment (build, push, migrate, deploy)
.\deploy.ps1 -Build -Push

# Deploy only
.\deploy.ps1

# Skip migration (if already run)
.\deploy.ps1 -SkipMigration
```

### Manual Steps

```bash
# 1. Create namespace and configuration
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-secret.yaml  # UPDATE FIRST!

# 2. Run database migrations
kubectl apply -f k8s/07-migration-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/myashes-db-migration -n myashes-backend

# 3. Deploy application
kubectl apply -f k8s/04-deployment.yaml
kubectl apply -f k8s/05-service.yaml
kubectl apply -f k8s/06-ingress.yaml

# 4. Check status
kubectl get all,certificate,ingress -n myashes-backend
```

## Maintenance

### View Logs

```bash
# Application logs
kubectl logs -n myashes-backend -l app=myashes-backend -f

# Migration logs
kubectl logs -n myashes-backend -l component=migration
```

### Update Deployment

```bash
# Pull latest image and restart
kubectl rollout restart deployment/myashes-backend -n myashes-backend

# Watch rollout
kubectl rollout status deployment/myashes-backend -n myashes-backend
```

### Run Migrations

```bash
# Delete old job and run new migration
kubectl delete job myashes-db-migration -n myashes-backend
kubectl apply -f k8s/07-migration-job.yaml
kubectl logs -n myashes-backend -l component=migration -f
```

### Database Access

```bash
# Connect to PostgreSQL
kubectl cnpg psql postgres-cluster postgres-system

# Switch to myashes database
\c myashes

# List tables
\dt

# Check migrations
SELECT * FROM alembic_version;
```

### Troubleshooting

```bash
# Check pod status
kubectl get pods -n myashes-backend

# Describe pod (events)
kubectl describe pod -n myashes-backend <pod-name>

# Check certificate
kubectl describe certificate -n myashes-backend myashes-backend-tls

# Test connectivity
kubectl port-forward -n myashes-backend svc/myashes-backend 8000:80
curl http://localhost:8000/health
```

## Configuration

### Environment Variables (ConfigMap)

- `APP_NAME`: Application name
- `API_V1_STR`: API version prefix
- `DEBUG`: Enable debug mode (false in production)
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_PORT`: PostgreSQL port
- `POSTGRES_DB`: Database name
- `MILVUS_HOST`: Milvus vector database host
- `MILVUS_PORT`: Milvus port
- `BACKEND_CORS_ORIGINS`: Allowed CORS origins

### Secrets

- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `SECRET_KEY`: JWT secret key (generate with `openssl rand -hex 32`)
- `OPENAI_API_KEY`: Optional OpenAI/vLLM API key
- `OPENAI_API_BASE`: Optional vLLM endpoint

## Resources

### Container Resources

- **Requests**: 200m CPU, 512Mi memory
- **Limits**: 1000m CPU, 2Gi memory

High memory limits due to ML dependencies (PyTorch, sentence-transformers).

### Deployment

- **Replicas**: 2 (HA)
- **Strategy**: RollingUpdate
- **Port**: 8000 (FastAPI)

## Networking

- **Service**: ClusterIP on port 80 → 8000
- **Ingress**: myashes-backend.lab.hq.solidrust.net
- **TLS**: Let's Encrypt DNS-01 (automatic)
- **CORS**: Enabled for myashes.ai and lab subdomain
- **Timeouts**: 300s (for ML operations)

## Tech Stack

- **Runtime**: Python 3.11
- **Framework**: FastAPI 0.104+
- **Server**: Uvicorn
- **Database**: PostgreSQL (CNPG cluster)
- **Vector DB**: Milvus
- **Migrations**: Alembic
- **AI/ML**: PyTorch, LangChain, sentence-transformers

## Files Overview

```
.
├── backend/               # Application source (from parent repo)
│   ├── app/               # FastAPI application
│   ├── migrations/        # Alembic migrations
│   └── requirements.txt   # Python dependencies
├── k8s/                   # Kubernetes manifests
│   ├── 01-namespace.yaml
│   ├── 02-configmap.yaml
│   ├── 03-secret.yaml
│   ├── 04-deployment.yaml
│   ├── 05-service.yaml
│   ├── 06-ingress.yaml
│   └── 07-migration-job.yaml
├── Dockerfile             # K8s-optimized multi-stage build
├── .dockerignore          # Docker build exclusions
├── build-and-push.ps1     # Docker build script
├── deploy.ps1             # K8s deployment script
├── CLAUDE.md              # Agent context
└── README-K8S.md          # This file
```

## Links

- **Production API**: https://myashes-backend.lab.hq.solidrust.net
- **API Docs**: https://myashes-backend.lab.hq.solidrust.net/docs
- **Docker Hub**: https://hub.docker.com/r/suparious/myashes-backend
- **GitHub**: https://github.com/SolidRusT/ashes-of-creation-assistant
- **Platform Docs**: Parent srt-hq-k8s repository

## Security Notes

⚠️ **IMPORTANT**:
1. Update secrets in `k8s/03-secret.yaml` before production use
2. Generate strong JWT secret: `openssl rand -hex 32`
3. Use strong PostgreSQL password
4. Secrets are templates only - create proper secrets via kubectl

## Support

For platform questions (ingress, storage, monitoring), query ChromaDB:
```
Collection: srt-hq-k8s-platform-guide
Query: "How do I connect to PostgreSQL CNPG cluster?"
```

---

**Last Updated**: 2025-11-12
**Status**: Ready for K8s deployment
