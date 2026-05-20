#!/usr/bin/env bash

# Production deploy script for FitForge AI backend.
# Usage: ./deploy.sh
# This script assumes it runs from the repository root on Ubuntu 24.04.

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

DEPLOY_ENV=${DEPLOY_ENV:-production}
ENV_FILE=${ENV_FILE:-.env}
APP_NAME=${APP_NAME:-fitforge-ai-backend}
PM2_CONFIG=${PM2_CONFIG:-ecosystem.config.js}
BUILD_COMMAND=${BUILD_COMMAND:-npm run build}

timestamp() {
  date --utc +"%Y-%m-%dT%H:%M:%SZ"
}

echo "[${timestamp()}] Starting FitForge AI backend deploy"

if [ -f "$ENV_FILE" ]; then
  echo "[${timestamp()}] Loading environment variables from $ENV_FILE"
  set -o allexport
  # shellcheck disable=SC1091
  source "$ENV_FILE"
  set +o allexport
else
  echo "[${timestamp()}] WARNING: $ENV_FILE not found; using environment variables from pm2/systemd environment"
fi

if [ -n "${GIT_BRANCH:-}" ]; then
  echo "[${timestamp()}] Pulling latest code from branch: $GIT_BRANCH"
  git fetch --all --prune
  git checkout "$GIT_BRANCH"
else
  echo "[${timestamp()}] Pulling latest code from current branch"
  git pull --ff-only
fi

echo "[${timestamp()}] Installing production dependencies"
npm ci --production

echo "[${timestamp()}] Generating Prisma client"
npx prisma generate

echo "[${timestamp()}] Applying Prisma migrations"
npx prisma migrate deploy

echo "[${timestamp()}] Building TypeScript sources"
$BUILD_COMMAND

echo "[${timestamp()}] Reloading PM2 application"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_CONFIG" --env "$DEPLOY_ENV"
else
  pm2 start "$PM2_CONFIG" --env "$DEPLOY_ENV"
fi

echo "[${timestamp()}] Saving PM2 process list"
pm2 save

echo "[${timestamp()}] Deployment completed successfully"
pm --version | sed 's/^/npm version: /'
node --version | sed 's/^/node version: /'
pm list @prisma/client --depth=0 2>/dev/null || true

exit 0
