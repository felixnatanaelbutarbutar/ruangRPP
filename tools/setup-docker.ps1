$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env'
if (Test-Path -LiteralPath $envPath) {
    Write-Host '.env sudah tersedia; tidak diubah.'
    exit 0
}
$randomBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($randomBytes) } finally { $rng.Dispose() }
$databasePassword = ([System.BitConverter]::ToString($randomBytes)).Replace('-', '').ToLowerInvariant()
[System.IO.File]::WriteAllText($envPath, "POSTGRES_PASSWORD=$databasePassword`nWEB_PORT=3000`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host '.env lokal dibuat dengan password database acak. Jangan commit file ini.'
