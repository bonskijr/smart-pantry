#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🐳 Starting Database..."
docker-compose up -d

echo "⏳ Waiting for database to initialize..."
sleep 3

echo "🔄 Running Prisma Migrations..."
npx prisma migrate dev

echo "🚀 Starting Backend (Background)..."
# Start backend in background and save its PID
npx tsx server/app.ts &
BACKEND_PID=$!

echo "🎨 Starting Frontend..."
# Run frontend in foreground
npm run dev

# When the script exits (e.g., Ctrl+C), kill the backend process
trap "kill $BACKEND_PID" EXIT
