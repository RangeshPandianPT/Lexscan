# Start backend and frontend simultaneously

Write-Host "Starting Database and Redis..." -ForegroundColor Green
Set-Location -Path .\backend
docker-compose up -d

Write-Host "Activating venv and starting Backend (FastAPI)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\venv\Scripts\activate; uvicorn app.main:app --reload" -WindowStyle Normal

Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Green
Set-Location -Path ..\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host "All systems starting! Backend runs on :8000, Frontend on :3000." -ForegroundColor Cyan
