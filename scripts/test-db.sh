#!/usr/bin/env bash
# Runs the database migrations + security tests against a DISPOSABLE PostgreSQL database.
# NEVER point this at your production database.
#
#   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/daff_test npm run test:db
#
# Quick throwaway Postgres with Docker:
#   docker run --rm -d -p 5433:5432 -e POSTGRES_PASSWORD=postgres --name daff-pg postgres:16
#   docker exec daff-pg createdb -U postgres daff_test
#   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5433/daff_test npm run test:db
set -euo pipefail

: "${TEST_DATABASE_URL:?Set TEST_DATABASE_URL to a disposable database}"
cd "$(dirname "$0")/.."

echo "→ Supabase stand-in schemas"
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/local-stub.sql 2>&1 | grep -v -e wal_level -e HINT || true
for f in supabase/migrations/*.sql; do
  echo "→ $f"
  psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "→ security & workflow tests"
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/security.test.sql
