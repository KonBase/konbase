#!/bin/sh
set -e

# Allow overriding host/port if needed
DB_HOST="${GEL_DB_HOST:-geldb}"
DB_PORT="${GEL_DB_PORT:-5432}"

echo "[entrypoint] Waiting for DB at ${DB_HOST}:${DB_PORT}..."
for i in $(seq 1 120); do
  if nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; then
    echo "[entrypoint] DB is up."
    break
  fi
  echo "[entrypoint] Attempt $i/120: DB not ready yet..."
  sleep 2
done

if ! nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; then
  echo "[entrypoint] DB not reachable after 240s, exiting." >&2
  exit 1
fi

# Wait a bit more for DB to be fully ready
echo "[entrypoint] DB is up, waiting for full initialization..."
sleep 10

echo "[entrypoint] Running migrations..."
npm run db:migrate || {
  echo "[entrypoint] Migrations failed." >&2
  exit 1
}

echo "[entrypoint] Starting Next.js..."
exec npm start
