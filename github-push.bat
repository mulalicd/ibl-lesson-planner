@echo off
cd /d "C:\PRIVATE\AI\IDSS IBL Planer 1"

echo.
echo ==========================================
echo   IBL Planer - GitHub Push
echo   https://github.com/mulalicd/ibl
echo ==========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo [INIT] Git nije inicijaliziran. Inicijalizujem...
    git init
    git remote add origin https://github.com/mulalicd/ibl.git
    git branch -M main
    echo [OK] Git inicijaliziran.
) else (
    echo [OK] Git repozitorij pronađen.
)

REM Check remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [INFO] Dodajem remote origin...
    git remote add origin https://github.com/mulalicd/ibl.git
)

REM Stage all files
echo.
echo [1/3] Dodajem sve fajlove...
git add .

REM Commit with timestamp
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set DATUM=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ("%time%") do set VRIJEME=%%a:%%b
set COMMIT_MSG=update: %DATUM% %VRIJEME%

echo [2/3] Komit: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

REM Push
echo [3/3] Push na GitHub...
echo.
git push -u origin main

echo.
if errorlevel 1 (
    echo [GRESKA] Push nije uspio.
    echo Provjerite GitHub Personal Access Token.
    echo GitHub.com - Settings - Developer settings - Personal access tokens
) else (
    echo [USPJEH] Kod je uspjesno pushovan na:
    echo https://github.com/mulalicd/ibl
)

echo.
pause