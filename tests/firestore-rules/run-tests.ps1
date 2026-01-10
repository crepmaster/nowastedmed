# Firebase Rules Test Runner (PowerShell)
# Single command: starts emulator, runs tests, stops emulator
# Requires: Java 21+, Node.js

param(
    [switch]$EmulatorOnly,  # Just start emulator (for manual test runs)
    [switch]$SkipInstall    # Skip npm install
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Firebase Rules Test Runner" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# --- Java 21 Check ---
$JavaPath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
if (-not (Test-Path "$JavaPath\bin\java.exe")) {
    # Try common alternatives
    $alternatives = @(
        "C:\Program Files\Java\jdk-21*",
        "C:\Program Files\Eclipse Adoptium\jdk-21*",
        "C:\Program Files\Microsoft\jdk-21*"
    )
    foreach ($alt in $alternatives) {
        $found = Get-ChildItem $alt -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $JavaPath = $found.FullName
            break
        }
    }
}

if (-not (Test-Path "$JavaPath\bin\java.exe")) {
    Write-Host "ERROR: Java 21 not found." -ForegroundColor Red
    Write-Host "Please install Java 21+ from https://adoptium.net/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Expected locations:" -ForegroundColor Gray
    Write-Host "  - C:\Program Files\Eclipse Adoptium\jdk-21*" -ForegroundColor Gray
    Write-Host "  - C:\Program Files\Java\jdk-21*" -ForegroundColor Gray
    exit 1
}

$env:JAVA_HOME = $JavaPath
$env:PATH = "$JavaPath\bin;$env:PATH"

# Verify Java 21 (java -version outputs to stderr, capture it)
$ErrorActionPreference = "Continue"
$javaVersion = & "$env:JAVA_HOME\bin\java.exe" -version 2>&1
$ErrorActionPreference = "Stop"
$javaVersionStr = $javaVersion -join " "
if ($javaVersionStr -notmatch "21\.") {
    Write-Host "ERROR: Java 21 required, found:" -ForegroundColor Red
    Write-Host $javaVersionStr -ForegroundColor Yellow
    exit 1
}

Write-Host "Java 21: $JavaPath" -ForegroundColor Green
Write-Host ""

# --- Change to test directory ---
$TestDir = $PSScriptRoot
Set-Location $TestDir

# --- Install dependencies if needed ---
if (-not $SkipInstall -and -not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# --- Run tests ---
if ($EmulatorOnly) {
    Write-Host "Starting emulator only (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host "Run 'npm test' in another terminal to execute tests." -ForegroundColor Gray
    Write-Host ""
    npx firebase emulators:start --only firestore
} else {
    Write-Host "Running tests with emulator..." -ForegroundColor Yellow
    Write-Host ""
    npx firebase emulators:exec --only firestore "npm test"
    $exitCode = $LASTEXITCODE

    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "All tests passed!" -ForegroundColor Green
    } else {
        Write-Host "Tests failed with exit code $exitCode" -ForegroundColor Red
    }
    exit $exitCode
}
