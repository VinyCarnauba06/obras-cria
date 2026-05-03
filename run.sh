#!/bin/bash
echo "🚀 Iniciando Backend e Frontend..."
cd /mnt/c/Dev/sistema-cria/backend && npm run dev &
BACKEND_PID=$!
sleep 2
cd /mnt/c/Dev/sistema-cria/frontend && npm run dev &
FRONTEND_PID=$!
echo "✅ Backend (PID $BACKEND_PID) em http://localhost:5000"
echo "✅ Frontend (PID $FRONTEND_PID) em http://localhost:8080"
wait
