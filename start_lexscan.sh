#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "\033[1;32m[1/3] Starting Database & Backend (FastAPI)...\033[0m"
cd "$DIR/Backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

# Seed if database doesn't exist
if [ ! -f "lexscan.db" ]; then
    echo "Seeding initial data..."
    ./venv/bin/python seed.py
fi

./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo -e "\033[1;32m[2/3] Starting Frontend (Next.js)...\033[0m"
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi
npm run dev &
FRONTEND_PID=$!

echo -e "\033[1;36m========================================================\033[0m"
echo -e "\033[1;36m🚀 LexScan is now running!\033[0m"
echo -e "\033[1;36m- Frontend Dashboard: http://localhost:3000\033[0m"
echo -e "\033[1;36m- Backend API & Docs: http://localhost:8000/docs\033[0m"
echo -e "\033[1;36m========================================================\033[0m"

cleanup() {
    echo -e "\nStopping LexScan services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
