#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
until PGPASSWORD=amukds4wi9001583845717ad2 psql -h dokploy-postgres-dev -U dokploy -d dokploy -c '\q'; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run database setup and migrations
echo "Running database setup..."
pnpm --filter=dokploy run setup
sleep 2
echo "Running database migrations..."
pnpm --filter=dokploy run migration:run

echo "Starting development server..."
# Start the development server with hot reloading
exec pnpm --filter=dokploy run dev:docker