@echo off
REM Setup script for SplitWise Pro FastAPI Routes
REM This batch file creates all route files in the correct locations

echo.
echo ===============================================
echo SplitWise Pro - FastAPI Routes Setup
echo ===============================================
echo.

cd /d "C:\Users\pc\Documents\SplitWise\backend"

if not exist "create_all_routes.py" (
    echo ERROR: create_all_routes.py not found!
    echo Please ensure you are in the correct directory.
    pause
    exit /b 1
)

echo Starting route setup...
echo.

python create_all_routes.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo SUCCESS! All routes have been created.
    echo ===============================================
    echo.
    echo Next steps:
    echo 1. Verify the app/routes/ directory has all files
    echo 2. Run: python -m uvicorn app.main:app --reload
    echo 3. Visit: http://localhost:8000/docs
    echo.
) else (
    echo.
    echo ERROR: Route setup failed!
    echo.
)

pause
