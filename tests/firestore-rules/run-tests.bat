@echo off
REM Firebase Rules Test Runner (Windows Batch)
REM Single command: starts emulator, runs tests, stops emulator
REM Requires: Java 21+, Node.js

setlocal enabledelayedexpansion

echo.
echo ===================================
echo Firebase Rules Test Runner
echo ===================================
echo.

REM --- Java 21 Check ---
set "JAVA_PATH=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"

if not exist "%JAVA_PATH%\bin\java.exe" (
    REM Try alternatives
    for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do set "JAVA_PATH=%%D"
)
if not exist "%JAVA_PATH%\bin\java.exe" (
    for /d %%D in ("C:\Program Files\Java\jdk-21*") do set "JAVA_PATH=%%D"
)
if not exist "%JAVA_PATH%\bin\java.exe" (
    for /d %%D in ("C:\Program Files\Microsoft\jdk-21*") do set "JAVA_PATH=%%D"
)

if not exist "%JAVA_PATH%\bin\java.exe" (
    echo ERROR: Java 21 not found.
    echo Please install Java 21+ from https://adoptium.net/
    echo.
    echo Expected locations:
    echo   - C:\Program Files\Eclipse Adoptium\jdk-21*
    echo   - C:\Program Files\Java\jdk-21*
    exit /b 1
)

set "JAVA_HOME=%JAVA_PATH%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Verify Java 21
java -version 2>&1 | findstr /i "21\." >nul
if errorlevel 1 (
    echo ERROR: Java 21 required.
    java -version
    exit /b 1
)

echo Java 21: %JAVA_HOME%
echo.

REM --- Change to test directory ---
cd /d "%~dp0"

REM --- Install dependencies if needed ---
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        exit /b 1
    )
    echo.
)

REM --- Run tests ---
if "%1"=="--emulator-only" (
    echo Starting emulator only ^(Ctrl+C to stop^)...
    echo Run 'npm test' in another terminal to execute tests.
    echo.
    call npx firebase emulators:start --only firestore
) else (
    echo Running tests with emulator...
    echo.
    call npx firebase emulators:exec --only firestore "npm test"

    echo.
    if errorlevel 1 (
        echo Tests failed!
        exit /b 1
    ) else (
        echo All tests passed!
    )
)
