$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path "$PSScriptRoot\.."
$src = Join-Path $projectRoot "App_Resources\Android\google-services.json"

if (!(Test-Path $src)) {
  Write-Host "ERROR: missing $src"
  exit 1
}

$targets = @(
  "platforms\android\app\google-services.json",
  "platforms\android\app\src\google-services.json",
  "platforms\android\app\src\debug\google-services.json"
)

foreach ($rel in $targets) {
  $dest = Join-Path $projectRoot $rel
  $dir = Split-Path $dest -Parent
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Copy-Item $src $dest -Force
  Write-Host "Copied: $rel"
}
