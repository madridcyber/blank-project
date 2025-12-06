#!/usr/bin/env bash
#
# Convenience script to build the backend and start the full Smart University stack via docker-compose.
# Usage:
#   ./scripts/start-platform.sh          # build + docker-compose up --build
#   SKIP_TESTS=1 ./scripts/start-platform.sh   # skip Maven tests
#   DETACH=1 ./scripts/start-platform.sh       # run docker-compose up -d
#

set -euo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "==> Checking required tools..."

if ! command -v mvn >/dev/null 2>&1; then
  echo "Error: Maven (mvn) is required but not installed or not in PATH." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is required but not installed or not in PATH." >&2
  exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "Error: docker-compose is required but not installed or not in PATH." >&2
  exit 1
fi

echo "==> Building backend with Maven..."

MVN_ARGS=("clean" "package")
if [ "${SKIP_TESTS:-0}" = "1" ]; then
  MVN_ARGS+=("-DskipTests")
fi

(
  cd "$ROOT_DIR"
  mvn "${MVN_ARGS[@]}"
)

echo "==> Starting full stack with docker-compose..."

cd "$ROOT_DIR"

DOCKER_ARGS=("up" "--build")
if [ "${DETACH:-0}" = "1" ]; then
  DOCKER_ARGS+=("-d")
fi

docker-compose "${DOCKER_ARGS[@]}"