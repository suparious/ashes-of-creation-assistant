#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy MyAshes.ai Backend to Kubernetes

.DESCRIPTION
    Deploys the MyAshes.ai FastAPI backend application to SRT-HQ Kubernetes cluster

.PARAMETER Build
    Build Docker image before deploying

.PARAMETER Push
    Push Docker image to Docker Hub (requires authentication)

.PARAMETER Uninstall
    Remove deployment from cluster

.PARAMETER SkipMigration
    Skip database migration job

.EXAMPLE
    .\deploy.ps1
    Deploy using existing Docker Hub image

.EXAMPLE
    .\deploy.ps1 -Build -Push
    Build, push, and deploy

.EXAMPLE
    .\deploy.ps1 -Uninstall
    Remove from cluster
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [switch]$Build,

    [Parameter(Mandatory = $false)]
    [switch]$Push,

    [Parameter(Mandatory = $false)]
    [switch]$Uninstall,

    [Parameter(Mandatory = $false)]
    [switch]$SkipMigration
)

$ErrorActionPreference = 'Stop'

#region Configuration

$APP_NAME = "myashes-backend"
$NAMESPACE = "myashes-backend"
$IMAGE = "suparious/myashes-backend:latest"
$K8S_DIR = "k8s"

# Color formatting
$colors = @{
    Header = 'Cyan'
    Success = 'Green'
    Warning = 'Yellow'
    Error = 'Red'
    Info = 'White'
}

#endregion

#region Functions

function Write-ColorOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [Parameter(Mandatory = $false)]
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-ColorOutput "===========================================" $colors.Header
    Write-ColorOutput " $Message" $colors.Header
    Write-ColorOutput "===========================================" $colors.Header
    Write-Host ""
}

#endregion

#region Main Script

# Handle uninstall
if ($Uninstall) {
    Write-Header "Uninstalling $APP_NAME from Kubernetes"

    Write-ColorOutput "Deleting Kubernetes resources..." $colors.Info
    kubectl delete -f "$K8S_DIR/07-migration-job.yaml" --ignore-not-found
    kubectl delete -f "$K8S_DIR/06-ingress.yaml" --ignore-not-found
    kubectl delete -f "$K8S_DIR/05-service.yaml" --ignore-not-found
    kubectl delete -f "$K8S_DIR/04-deployment.yaml" --ignore-not-found
    kubectl delete -f "$K8S_DIR/03-secret.yaml" --ignore-not-found
    kubectl delete -f "$K8S_DIR/02-configmap.yaml" --ignore-not-found
    kubectl delete -f "$K8S_DIR/01-namespace.yaml" --ignore-not-found

    Write-ColorOutput "✅ Uninstallation complete" $colors.Success
    Write-Host ""
    Write-ColorOutput "NOTE: Database 'myashes' in PostgreSQL cluster was NOT deleted" $colors.Warning
    Write-ColorOutput "To clean up database manually:" $colors.Info
    Write-Host "  kubectl cnpg psql postgres-cluster postgres-system" -ForegroundColor Yellow
    Write-Host "  DROP DATABASE IF EXISTS myashes;" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Header "Deploying $APP_NAME to Kubernetes"

# Build and push if requested
if ($Build) {
    Write-ColorOutput "Building Docker image..." $colors.Info

    if ($Push) {
        & .\build-and-push.ps1 -Push
    }
    else {
        & .\build-and-push.ps1
    }

    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Build failed" $colors.Error
        exit 1
    }
    Write-Host ""
}

# Deploy to Kubernetes
Write-ColorOutput "Applying Kubernetes manifests..." $colors.Info

# Create namespace, configmap, and secret
kubectl apply -f "$K8S_DIR/01-namespace.yaml"
kubectl apply -f "$K8S_DIR/02-configmap.yaml"

# Check if secret exists, if not apply the template (user should update it)
$secretExists = kubectl get secret myashes-backend-secrets -n $NAMESPACE 2>$null
if (-not $secretExists) {
    Write-ColorOutput "Creating secret from template..." $colors.Warning
    Write-ColorOutput "⚠️  IMPORTANT: Update secrets before production use!" $colors.Warning
    kubectl apply -f "$K8S_DIR/03-secret.yaml"
    Write-Host ""
}

# Run database migrations (unless skipped)
if (-not $SkipMigration) {
    Write-ColorOutput "Running database migrations..." $colors.Info

    # Delete old migration job if it exists
    kubectl delete job myashes-db-migration -n $NAMESPACE --ignore-not-found 2>$null

    # Apply migration job
    kubectl apply -f "$K8S_DIR/07-migration-job.yaml"

    # Wait for migration to complete (5 minute timeout)
    Write-ColorOutput "Waiting for migration job to complete (timeout: 5min)..." $colors.Info
    $migrationResult = kubectl wait --for=condition=complete --timeout=300s job/myashes-db-migration -n $NAMESPACE 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "⚠️  Migration job did not complete successfully" $colors.Warning
        Write-ColorOutput "Check logs: kubectl logs -n $NAMESPACE -l component=migration" $colors.Info
        Write-Host ""
        $continue = Read-Host "Continue with deployment anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-ColorOutput "Deployment cancelled" $colors.Error
            exit 1
        }
    }
    else {
        Write-ColorOutput "✅ Database migrations completed" $colors.Success
    }
    Write-Host ""
}

# Deploy application
Write-ColorOutput "Deploying application..." $colors.Info
kubectl apply -f "$K8S_DIR/04-deployment.yaml"
kubectl apply -f "$K8S_DIR/05-service.yaml"
kubectl apply -f "$K8S_DIR/06-ingress.yaml"

Write-ColorOutput "✅ Kubernetes manifests applied" $colors.Success
Write-Host ""

# Wait for rollout
Write-ColorOutput "Waiting for rollout to complete..." $colors.Info
kubectl rollout status deployment/$APP_NAME -n $NAMESPACE --timeout=300s

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "⚠️  Rollout did not complete in time" $colors.Warning
    Write-ColorOutput "Check status: kubectl get pods -n $NAMESPACE" $colors.Info
}
else {
    Write-ColorOutput "✅ Rollout complete" $colors.Success
}
Write-Host ""

# Display status
Write-Header "Deployment Status"

Write-ColorOutput "Pods:" $colors.Header
kubectl get pods -n $NAMESPACE

Write-Host ""
Write-ColorOutput "Service:" $colors.Header
kubectl get svc -n $NAMESPACE

Write-Host ""
Write-ColorOutput "Ingress:" $colors.Header
kubectl get ingress -n $NAMESPACE

Write-Host ""
Write-ColorOutput "Certificate:" $colors.Header
kubectl get certificate -n $NAMESPACE

Write-Host ""
Write-Header "Useful Commands"

Write-ColorOutput "View logs:" $colors.Info
Write-Host "  kubectl logs -n $NAMESPACE -l app=$APP_NAME -f" -ForegroundColor Yellow

Write-ColorOutput "View migration logs:" $colors.Info
Write-Host "  kubectl logs -n $NAMESPACE -l component=migration" -ForegroundColor Yellow

Write-ColorOutput "Check API health:" $colors.Info
Write-Host "  curl -k https://myashes-backend.lab.hq.solidrust.net/health" -ForegroundColor Yellow

Write-ColorOutput "API Documentation:" $colors.Info
Write-Host "  https://myashes-backend.lab.hq.solidrust.net/docs" -ForegroundColor Yellow

Write-ColorOutput "Port-forward for local testing:" $colors.Info
Write-Host "  kubectl port-forward -n $NAMESPACE svc/$APP_NAME 8000:80" -ForegroundColor Yellow

Write-ColorOutput "Update deployment:" $colors.Info
Write-Host "  kubectl rollout restart deployment/$APP_NAME -n $NAMESPACE" -ForegroundColor Yellow

Write-ColorOutput "Uninstall:" $colors.Info
Write-Host "  .\deploy.ps1 -Uninstall" -ForegroundColor Yellow

Write-Host ""
Write-ColorOutput "🎉 Deployment complete!" $colors.Success
Write-Host "   Access API at: https://myashes-backend.lab.hq.solidrust.net" -ForegroundColor Green
Write-Host ""

#endregion
