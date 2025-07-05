# Clean and start Next.js development server
Write-Host "Cleaning Next.js cache and build files..." -ForegroundColor Yellow

# Stop any running Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove .next directory
if (Test-Path .next) {
    Remove-Item -Path .next -Recurse -Force
    Write-Host "Removed .next directory" -ForegroundColor Green
}

# Clear Node.js module cache
if (Test-Path node_modules/.cache) {
    Remove-Item -Path node_modules/.cache -Recurse -Force
    Write-Host "Cleared Node modules cache" -ForegroundColor Green
}

# Clear npm cache
npm cache clean --force 2>$null

Write-Host "Starting development server..." -ForegroundColor Yellow
npm run dev
