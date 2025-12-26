@echo off
REM CHEFAA CLONE - QUICK START SCRIPT FOR WINDOWS
REM This script automates the setup process
REM Usage: QUICK_START.bat

REM Set UTF-8 encoding
chcp 65001 >nul

echo.
echo =====================================================
echo   ^26^ CHEFAA CLONE - QUICK START
echo =====================================================
echo.

REM Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X pnpm is not installed!
    echo   Installing pnpm globally...
    call npm install -g pnpm
)

REM Show versions
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo ^/ pnpm found: %PNPM_VERSION%

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ^/ Node.js found: %NODE_VERSION%
echo.

REM Step 1: Clean
echo ^) Step 1: Cleaning previous installation...
call pnpm clean >nul 2>&1
call pnpm store prune >nul 2>&1
echo ^/ Clean complete
echo.

REM Step 2: Install
echo ^) Step 2: Installing dependencies...
echo    This may take 3-5 minutes on first run...
call pnpm install --prefer-offline
if %ERRORLEVEL% NEQ 0 (
    echo X Installation failed
    exit /b 1
)
echo ^/ Installation complete
echo.

REM Step 3: Verify
echo ^) Step 3: Verifying installation...
echo    Checking packages...
call pnpm ls --depth=0 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ^/ Packages verified
) else (
    echo X Package verification failed
)
echo.

REM Step 4: Build
echo ^) Step 4: Building project...
echo    This may take 30-60 seconds...
call pnpm run build >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ^/ Build successful
) else (
    echo X Build failed
)
echo.

REM Step 5: Ready
echo =====================================================
echo  ^/ SETUP COMPLETE!
echo =====================================================
echo.
echo To start the development server, run:
echo   pnpm run dev
echo.
echo The app will open at: http://localhost:5173
echo.
echo For other commands, see FIXES_AND_SETUP.md
echo.
pause
