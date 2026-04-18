#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

for i in $(seq 1 40); do
  if psql "$DATABASE_URL" -c 'SELECT 1' >/dev/null 2>&1; then
    break
  fi
  echo "Waiting for database... ($i/40)"
  sleep 2
done

for f in /app/migrations/*.sql; do
  echo "Applying migration: $f"
  psql "$DATABASE_URL" -f "$f"
done

echo "Migrations complete"
