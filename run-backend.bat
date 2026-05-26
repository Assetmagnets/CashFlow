@echo off
echo ===================================================
echo 🚀 STARTING CASHFLOW BACKEND IN ONE CLICK!
echo ===================================================

echo 📦 Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install failed!
    pause
    exit /b %ERRORLEVEL%
)

echo 🔑 Step 2: Generating Prisma Client...
call npm run prisma:generate --workspace=server
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Prisma generation failed!
    pause
    exit /b %ERRORLEVEL%
)

echo 🗄️ Step 3: Pushing database schema...
call npm run prisma:push --workspace=server
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database push failed!
    pause
    exit /b %ERRORLEVEL%
)

echo 🌱 Step 4: Seeding database...
call npm run prisma:seed --workspace=server
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database seed failed!
    pause
    exit /b %ERRORLEVEL%
)

echo 🚀 Step 5: Committing and pushing restored changes to Git...
call git add -A
call git commit -m "chore: restore seed script and add setup script"
call git push origin main

echo ===================================================
echo 🎉 SUCCESS! Restored setup has been pushed to Vercel!
echo 🚀 Now starting the backend local development server...
echo ===================================================
call npm run start:dev --workspace=server
