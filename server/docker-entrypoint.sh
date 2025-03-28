#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  echo "PostgreSQL not ready - sleeping"
  sleep 1
done
echo "PostgreSQL is ready!"

# Verify PostgreSQL connection
echo "Verifying PostgreSQL connection..."
until PGPASSWORD=cellmapper psql -h postgres -U cellmapper -d cellmapper -c "SELECT 1" > /dev/null 2>&1; do
  echo "PostgreSQL connection failed - retrying"
  sleep 1
done
echo "PostgreSQL connection verified!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until nc -z redis 6379; do
  echo "Redis not ready - sleeping"
  sleep 1
done
echo "Redis is ready!"

# Verify Redis connection
echo "Verifying Redis connection..."
until redis-cli -h redis ping > /dev/null 2>&1; do
  echo "Redis connection failed - retrying"
  sleep 1
done
echo "Redis connection verified!"

# Run database migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate

# Run seeders if needed
echo "Running database seeders..."
npx sequelize-cli db:seed:all

# Start the server
echo "Starting the server..."
exec "$@"
