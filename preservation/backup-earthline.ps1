# Earthline independent frozen-source backup (PowerShell 5.1+, Windows)
# Requires Git installed. No ChatGPT or Claude.
param([string]$Destination = (Join-Path (Get-Location) "EARTHLINE-FROZEN-2026-11-26"))
$ErrorActionPreference = 'Stop'
$repo = "https://github.com/Earthlinedevelopment/open-source-watershed-intelligence-platform."
$branch = "release/earthline-frozen-20261126-r1"
$expectedCommit = "b926c9e512fe9fc09ddfea3c7ed51239e7d0b8fe"
$expectedBlob = "745de00dcfafc3aeb6607497fd8a4830c34555b2"
$Destination = [System.IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $Destination) { throw "Destination already exists; choose a NEW empty location to preserve the previous backup." }
New-Item -ItemType Directory -Path $Destination -Force | Out-Null
$checkout = Join-Path $Destination "full-source-checkout"
& git clone --branch $branch --single-branch $repo $checkout
if ($LASTEXITCODE -ne 0) { throw "Git clone failed; do not trust incomplete backup." }
$actual = (& git -C $checkout rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $actual -ne $expectedCommit) { throw "Commit identity mismatch: $actual" }
$blob = (& git -C $checkout hash-object index.html).Trim()
if ($LASTEXITCODE -ne 0 -or $blob -ne $expectedBlob) { throw "index.html identity mismatch: $blob" }
$zip = Join-Path $Destination "EARTHLINE-FROZEN-SOURCE-2026-11-26.zip"
& git -C $checkout archive --format=zip "--output=$zip" HEAD
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $zip)) { throw "Git archive failed." }
$hash = (Get-FileHash -Algorithm SHA256 $zip).Hash
@(
  "EARTHLINE FROZEN BACKUP - 2026-11-26"
  "Repository: $repo"
  "Branch: $branch"
  "Full commit: $actual"
  "index.html Git blob SHA-1: $blob"
  "ZIP SHA-256: $hash"
  "ZIP: $zip"
  "Clone: $checkout"
  "Note: the ZIP contains files but not git history; keep the checkout's .git folder."
  "Keep an additional independent OFFLINE copy."
) | Set-Content -Encoding UTF8 (Join-Path $Destination "VERIFY-SOURCE.txt")
Write-Host "Backup verified. Full source and Git checkout saved to: $Destination"
Write-Host "ZIP SHA-256: $hash"
