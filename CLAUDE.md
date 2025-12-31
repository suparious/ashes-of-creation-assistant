# CLAUDE.md - MyAshes.ai Backend Agent Context

**Project**: AI-powered assistant backend for Ashes of Creation MMORPG
**Status**: K8s deployment ready (backend only)
**Last Updated**: 2025-12-30
**Shaun's Golden Rule**: **No workarounds, no temporary fixes, no disabled functionality. Full solutions only.**

---

## ⚡ AGENT QUICK START

**Your job**: Help with MyAshes.ai Backend - FastAPI application with ML/AI capabilities on Kubernetes.

**Shaun's top rule**: No workarounds, no temporary fixes, complete solutions only.

**Where to start**:
1. Read "Project Overview" below
2. Understand this deploys BACKEND ONLY (frontend is GitHub Pages)
3. Check deployment dependencies (PostgreSQL, Milvus)
4. Use ChromaDB for platform integration questions

---

## 📚 PLATFORM INTEGRATION (ChromaDB Knowledge Base)

**When working in this submodule**, you cannot access the parent srt-hq-k8s repository files. Use ChromaDB to query platform capabilities and integration patterns.

**Collection**: `srt-hq-k8s-platform-guide` (43 docs, updated 2025-11-11)

**Why This Matters for MyAshes.ai Backend**:
The backend is deployed on the SRT-HQ Kubernetes platform and integrates with:
- **Platform PostgreSQL** (CNPG cluster) for relational data
- **Platform Milvus** (data tier) for vector embeddings
- **Platform vLLM** (via Artemis proxy) for AI inference
- **Platform ingress** for SSL and routing

**Query When You Need**:
- Platform architecture and three-tier taxonomy
- PostgreSQL connection details and database management
- Milvus vector store integration
- vLLM inference endpoint configuration
- Platform monitoring and logging integration
- Ingress and SSL certificate patterns

**Example Queries**:
```
"What is the srt-hq-k8s platform architecture?"
"How do I connect to the PostgreSQL CNPG cluster?"
"What is the Milvus vector store endpoint?"
"How does SSL certificate automation work?"
"What storage classes are available?"
```

**When NOT to Query**:
- ❌ FastAPI development (use FastAPI docs)
- ❌ Python/ML libraries (use requirements.txt + docs)
- ❌ Application business logic (see backend/ source code)
- ❌ Docker build process (use Dockerfile + build-and-push.ps1)

---

## 📍 PROJECT OVERVIEW

**Application Type**: RESTful API backend for Ashes of Creation game assistant
**Tech Stack**: Python 3.11 + FastAPI + ML/AI libraries
**Deployment**: K8s backend only (frontend deployed separately to GitHub Pages)
**External Domain**: myashes.ai (proxied via Artemis)
**Internal Domain**: myashes-backend.lab.hq.solidrust.net

**Key Features**:
- AI chat assistant for game mechanics
- Character build planning
- Item database with semantic search
- Crafting calculator
- Resource tracking
- User authentication (JWT)
- Vector similarity search (Milvus)
- Database migrations (Alembic)

**Architecture**:
```
Frontend (myashes.ai - GitHub Pages)
│   └─→ SolidRusT/myashes.github.io
    ↓
Artemis Proxy (AWS HTTP/3)
    ↓
K8s Ingress (myashes-backend.lab.hq.solidrust.net)
    ↓
FastAPI Backend (2 replicas)
│   └─→ Suparious/ashes-of-creation-assistant (this repo)
    ↓
Platform PostgreSQL (CNPG) + Platform Milvus (Vector DB)
```

---

## 🗂️ LOCATIONS

**Repository**:
- GitHub: `git@github.com:Suparious/ashes-of-creation-assistant.git`
- Submodule: `/Users/shaun/repos/srt-hq-k8s/manifests/apps/myashes-backend/`
- Standalone: `/Users/shaun/repos/ashes-of-creation-assistant/`

**Landing Page** (separate repo):
- GitHub: `git@github.com:SolidRusT/myashes.github.io.git`
- Location: `/Users/shaun/repos/myashes.github.io/`
- Live: https://myashes.ai

**Deployment**:
- Dev: `cd backend && uvicorn app.main:app --reload` → `http://localhost:8000`
- Docker Test: `docker run -p 8000:8000 suparious/myashes-backend:latest`
- Production: `https://myashes-backend.lab.hq.solidrust.net` (K8s namespace: `myashes-backend`)
- API Docs: `https://myashes-backend.lab.hq.solidrust.net/docs` (Swagger UI)

**Images**:
- Docker Hub: `suparious/myashes-backend:latest`
- Public URL: `https://hub.docker.com/r/suparious/myashes-backend`

**Backend Source**:
- All backend code is in `backend/` subdirectory of the repository
- App code: `backend/app/`
- Migrations: `backend/migrations/`

---

## 🛠️ TECH STACK

### Backend (Python + FastAPI)
- **FastAPI**: 0.104+ (web framework)
- **Uvicorn**: 0.24+ (ASGI server)
- **Pydantic**: 2.0+ (data validation)
- **SQLAlchemy**: 2.0+ (ORM)
- **Alembic**: 1.13+ (database migrations)
- **PostgreSQL**: psycopg2-binary (database driver)

### AI/ML Libraries
- **PyTorch**: 2.7.1 (deep learning)
- **sentence-transformers**: 2.2.2 (embeddings)
- **langchain**: 0.2.x (LLM framework)
- **langchain-openai**: 0.1.x (vLLM integration)

### Data Stores
- **PostgreSQL**: Platform CNPG cluster (relational data)
- **Milvus**: Platform vector database (embeddings)
- **Redis**: Optional cache (not yet deployed)

### Production (Docker + Kubernetes)
- **Base Image**: python:3.11-slim (multi-stage build)
- **Build Time**: 5-10 minutes (ML dependencies)
- **Image Size**: ~2-3 GB (includes PyTorch)
- **Orchestration**: Kubernetes 1.34+
- **Ingress**: nginx-ingress with Let's Encrypt DNS-01

---

## 📁 PROJECT STRUCTURE

```
ashes-of-creation-assistant/
├── backend/                   # Backend application (THIS deployment)
│   ├── app/                   # FastAPI application
│   │   ├── api/               # API routes
│   │   │   └── v1/            # API version 1
│   │   ├── core/              # Core utilities
│   │   ├── crud/              # Database operations
│   │   ├── db/                # Database configuration
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── config.py          # Application settings
│   │   └── main.py            # Application entry point
│   ├── migrations/            # Alembic migrations
│   ├── alembic.ini            # Alembic configuration
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Original docker-compose Dockerfile
│   └── entrypoint.sh          # Original entrypoint (not used in K8s)
├── frontend/                  # Next.js frontend (separate deployment)
├── data-pipeline/             # Data scraping (not deployed)
├── k8s/                       # K8s manifests (K8s deployment only)
│   ├── 01-namespace.yaml
│   ├── 02-configmap.yaml
│   ├── 03-secret.yaml
│   ├── 04-deployment.yaml
│   ├── 05-service.yaml
│   ├── 06-ingress.yaml
│   └── 07-migration-job.yaml
├── Dockerfile                 # K8s-optimized multi-stage build
├── .dockerignore              # Docker build exclusions
├── build-and-push.ps1         # Docker build script
├── deploy.ps1                 # Kubernetes deployment
├── CLAUDE.md                  # This file
└── README-K8S.md              # Deployment documentation
```

**Note**: Files marked "K8s deployment only" are in the submodule but NOT in the standalone repository.

---

## 🚀 DEVELOPMENT WORKFLOW

### Local Development

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
export DATABASE_URL="postgresql://user:pass@localhost/myashes"
export SECRET_KEY="your-secret-key"

# Run migrations
alembic upgrade head

# Start dev server (with auto-reload)
uvicorn app.main:app --reload
# Access: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Docker Testing

```bash
# Build image locally
.\build-and-push.ps1

# Test image (requires external database)
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e SECRET_KEY="test-key" \
  suparious/myashes-backend:latest
# Access: http://localhost:8000/docs
```

### Production Deployment

```powershell
# Build and push to Docker Hub
.\build-and-push.ps1 -Login -Push

# Deploy to Kubernetes (includes migrations)
.\deploy.ps1

# Or build + push + deploy in one command
.\deploy.ps1 -Build -Push
```

---

## 📋 DEPLOYMENT

### Quick Deploy (Recommended)

```powershell
# Full deployment (build, push, deploy with migrations)
.\deploy.ps1 -Build -Push

# Deploy only (uses existing Docker Hub image)
.\deploy.ps1

# Uninstall
.\deploy.ps1 -Uninstall
```

### Manual Deployment

```bash
# Build and push Docker image
docker build -t suparious/myashes-backend:latest .
docker push suparious/myashes-backend:latest

# Deploy to cluster
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-secret.yaml  # UPDATE SECRETS FIRST!

# Run migrations
kubectl apply -f k8s/07-migration-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/myashes-db-migration -n myashes-backend

# Deploy application
kubectl apply -f k8s/04-deployment.yaml
kubectl apply -f k8s/05-service.yaml
kubectl apply -f k8s/06-ingress.yaml

# Verify deployment
kubectl get all -n myashes-backend
kubectl get certificate -n myashes-backend
```

---

## 🔧 COMMON TASKS

### View Logs

```bash
# Application logs
kubectl logs -n myashes-backend -l app=myashes-backend -f

# Migration logs
kubectl logs -n myashes-backend -l component=migration

# Specific pod
kubectl logs -n myashes-backend <pod-name> -f
```

### Database Operations

```bash
# Connect to PostgreSQL
kubectl cnpg psql postgres-cluster postgres-system

# Create database (first-time setup)
CREATE DATABASE myashes;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE myashes TO myashes;

# List databases
\l

# Connect to myashes database
\c myashes
```

### Run Migrations

```bash
# Delete old migration job
kubectl delete job myashes-db-migration -n myashes-backend

# Run new migration
kubectl apply -f k8s/07-migration-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/myashes-db-migration -n myashes-backend

# Check migration status
kubectl logs -n myashes-backend -l component=migration
```

### Update Deployment

```bash
# Restart pods (pull latest image)
kubectl rollout restart deployment/myashes-backend -n myashes-backend

# Watch rollout status
kubectl rollout status deployment/myashes-backend -n myashes-backend

# Check deployment history
kubectl rollout history deployment/myashes-backend -n myashes-backend
```

### Update Secrets

```bash
# Create/update secret
kubectl create secret generic myashes-backend-secrets \
  -n myashes-backend \
  --from-literal=POSTGRES_USER=myashes \
  --from-literal=POSTGRES_PASSWORD='your-password' \
  --from-literal=SECRET_KEY='your-secret-key' \
  --from-literal=OPENAI_API_BASE='https://vllm.lab.hq.solidrust.net/v1' \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployment to pick up new secrets
kubectl rollout restart deployment/myashes-backend -n myashes-backend
```

---

## 🎯 USER PREFERENCES (CRITICAL)

### Solutions
- ✅ **Complete, working solutions** - Every change must be immediately deployable
- ✅ **Direct execution** - Use available tools, verify in real-time
- ✅ **No back-and-forth** - Show results, iterate to solution
- ❌ **NO workarounds** - If symptoms remain, keep digging for root cause
- ❌ **NO temporary files** - All code is production code
- ❌ **NO disabled functionality** - Don't hack around errors, fix them
- ✅ **Git as source of truth** - All changes in code, nothing manual

### Code Quality
- Full files, never patch fragments (unless part of strategy)
- Scripts work on first run (no retry logic needed)
- Documentation before infrastructure
- Reproducibility via automation

---

## 💡 KEY DECISIONS

### Why Backend-Only Deployment?
- Frontend is static Next.js site (better on GitHub Pages + CDN)
- Backend needs K8s for database integration, scaling, monitoring
- Separation allows independent scaling and deployment
- Frontend can be served globally via Cloudflare CDN

### Why Platform PostgreSQL (CNPG)?
- Already deployed and managed
- High availability with automatic failover
- Automated backups
- No need for separate database deployment

### Why Platform Milvus?
- Centralized vector database for all platform AI workloads
- Shared infrastructure reduces complexity
- Better resource utilization

### Why Init Container for Database Wait?
- K8s best practice vs. entrypoint wait logic
- Cleaner separation of concerns
- Better visibility in pod status

### Why Separate Migration Job?
- Migrations need to run ONCE before deployment
- Avoid race conditions with multiple replicas
- Better control and observability
- Can be re-run independently

### Why 2 Replicas?
- High availability for API backend
- Load distribution
- Zero-downtime deployments
- Balance between HA and resource usage

---

## 🔍 VALIDATION

### After Deployment

```bash
# 1. Check pods are running
kubectl get pods -n myashes-backend
# Expected: 2/2 pods Running

# 2. Check migration completed
kubectl get jobs -n myashes-backend
# Expected: myashes-db-migration COMPLETIONS=1/1

# 3. Check service
kubectl get svc -n myashes-backend
# Expected: ClusterIP service on port 80

# 4. Check ingress
kubectl get ingress -n myashes-backend
# Expected: myashes-backend.lab.hq.solidrust.net with ADDRESS

# 5. Check certificate
kubectl get certificate -n myashes-backend
# Expected: READY=True (may take 1-2 minutes)

# 6. Test health endpoint
curl -k https://myashes-backend.lab.hq.solidrust.net/health
# Expected: {"status":"healthy"}

# 7. Test API docs
# Open https://myashes-backend.lab.hq.solidrust.net/docs
# Expected: Swagger UI loads

# 8. Check database
kubectl cnpg psql postgres-cluster postgres-system
\c myashes
\dt
# Expected: Tables created by migrations
```

---

## 🔐 SECURITY CONSIDERATIONS

### Secrets Management
- ⚠️ **CRITICAL**: Update secrets before production use
- Default secrets in k8s/03-secret.yaml are templates only
- Use strong passwords for PostgreSQL
- Generate JWT secret with: `openssl rand -hex 32`
- Store sensitive API keys in secrets, not configmaps

### Database Security
- Backend connects to PostgreSQL with service account credentials
- User `myashes` has access ONLY to `myashes` database
- No superuser access from application
- Credentials stored in Kubernetes secrets

### API Security
- JWT-based authentication
- CORS enabled for specific origins only
- HTTPS enforced via ingress
- Rate limiting (TODO: implement)

---

## 🎓 AGENT SUCCESS CRITERIA

You're doing well if:

✅ You understand this is backend-only deployment (frontend separate)
✅ You know it integrates with platform PostgreSQL and Milvus
✅ You understand migration job runs before deployment
✅ You reference ChromaDB for platform questions
✅ You provide complete solutions (never workarounds)
✅ You use PowerShell scripts for deployment
✅ You validate changes work end-to-end
✅ You remember this is a game assistant backend (not the game itself)
✅ You check requirements.txt for Python dependencies
✅ You respect Shaun's "no workarounds" philosophy

---

## 📅 CHANGE HISTORY

| Date | Change | Impact |
|------|--------|--------|
| 2025-12-30 | Landing page live | myashes.ai deployed via SolidRusT/myashes.github.io |
| 2025-12-30 | Updated paths to macOS | Migrated from WSL to native macOS |
| 2025-11-12 | Initial onboarding | Backend added to SRT-HQ K8s platform |
| 2025-11-12 | Created K8s Dockerfile | Multi-stage build optimized for K8s |
| 2025-11-12 | Created K8s manifests | Deployment with ConfigMap, Secret, Migration Job |
| 2025-11-12 | Created PowerShell scripts | build-and-push.ps1, deploy.ps1 |
| 2025-11-12 | Added as git submodule | Integrated into srt-hq-k8s repo |

---

**Last Updated**: 2025-12-30
**Status**: K8s Deployment Ready (Backend Only)
**Platform**: SRT-HQ Kubernetes
**Access**: https://myashes-backend.lab.hq.solidrust.net

---

*Attach this file to MyAshes.ai Backend conversations for complete context.*
