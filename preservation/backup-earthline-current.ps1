# Earthline current best-available release — independent full-source backup
# Requires Git and PowerShell 5.1+. No AI, paid services, or stored credentials.
param([string]$Destination=(Join-Path (Get-Location) 'EARTHLINE-BEST-AVAILABLE-2026-11-26'))
$ErrorActionPreference='Stop'
$repo='https://github.com/Earthlinedevelopment/open-source-watershed-intelligence-platform.'
$release='release/earthline-best-available-20261126'
$commit='dde749c431e3e0938d3d00dedfca067905f81b95'
$indexBlob='cec59484c7678006c830e2655a094d61f9ef79e9'
$engineBlob='8e78b3d67d699f0d552bb7a6e36785ccbb30743d'
$Destination=[System.IO.Path]::GetFullPath($Destination)
if(Test-Path -LiteralPath $Destination){throw "Existing backup: use another destination; no overwrites."}
New-Item -ItemType Directory -Path $Destination | Out-Null
$checkout=Join-Path $Destination 'full-source-and-git-history'
& git clone --branch $release --single-branch $repo $checkout
if($LASTEXITCODE -ne 0){throw 'Git clone failed'}
$actual=(& git -C $checkout rev-parse HEAD).Trim()
if($LASTEXITCODE -ne 0 -or $actual -ne $commit){throw "Commit mismatch: $actual"}
$indexActual=(& git -C $checkout hash-object index.html).Trim()
if($LASTEXITCODE -ne 0 -or $indexActual -ne $indexBlob){throw "index.html mismatch: $indexActual"}
$engineActual=(& git -C $checkout hash-object earthline-property-swales.js).Trim()
if($LASTEXITCODE -ne 0 -or $engineActual -ne $engineBlob){throw "Property swale engine mismatch: $engineActual"}
$zip=Join-Path $Destination 'EARTHLINE-BEST-AVAILABLE-SOURCE-2026-11-26.zip'
& git -C $checkout archive --format=zip "--output=$zip" HEAD
if($LASTEXITCODE -ne 0 -or -not (Test-Path $zip)){throw 'Source ZIP export failed'}
$zipSha=(Get-FileHash -Algorithm SHA256 $zip).Hash
@(
 'Earthline verified source archive - 2026-11-26'
 "Repository: $repo"
 "Release branch: $release"
 "Commit: $actual"
 "Index Git blob: $indexActual"
 "Property engine Git blob: $engineActual"
 "ZIP SHA-256: $zipSha"
 "ZIP: $zip"
 "Git checkout: $checkout"
 'CAUTION: source saved, browser/science acceptance NOT verified.'
 'Copy this entire directory to a separate offline device.'
)|Set-Content -Encoding UTF8 (Join-Path $Destination 'VERIFY-SOURCE.txt')
Write-Host "Frozen version successfully backed up: $Destination"
Write-Host "ZIP SHA-256: $zipSha"
