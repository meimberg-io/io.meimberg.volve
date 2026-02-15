#!/bin/bash
# Merge .env.config + .env into .env.runtime and run docker compose
# Usage: ./run.sh up -d | ./run.sh down | ./run.sh logs -f

set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Error: .env not found. Copy .env.example to .env and fill in your values."
  exit 1
fi

# Merge shared config + env-specific values/secrets
cat .env.config .env > .env.runtime

docker compose --env-file .env.runtime "$@"
