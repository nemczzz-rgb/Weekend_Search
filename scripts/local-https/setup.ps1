param([switch]$Trust)

$ErrorActionPreference = 'Stop'

if (-not $env:LOCALAPPDATA) {
    throw 'LOCALAPPDATA is not set. This setup script is for Windows.'
}

$certificateDirectory = Join-Path $env:LOCALAPPDATA 'WeekendSearch\https'
$pfxPath = Join-Path $certificateDirectory 'localhost.pfx'
$publicPath = Join-Path $certificateDirectory 'localhost.cer'
$passwordPath = Join-Path $certificateDirectory 'passphrase.txt'
$thumbprintPath = Join-Path $certificateDirectory 'thumbprint.txt'
$paths = @($pfxPath, $publicPath, $passwordPath, $thumbprintPath)
$existing = @($paths | Where-Object { Test-Path -LiteralPath $_ })

if ($existing.Count -ne 0 -and $existing.Count -ne $paths.Count) {
    throw "Incomplete local certificate files in $certificateDirectory. Inspect them before retrying."
}

if ($existing.Count -eq 0) {
    New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null
    $certificate = New-SelfSignedCertificate `
        -Type SSLServerAuthentication `
        -Subject 'CN=localhost' `
        -TextExtension @('2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1&IPAddress=::1') `
        -CertStoreLocation 'Cert:\CurrentUser\My' `
        -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
        -KeyExportPolicy Exportable -NotAfter (Get-Date).AddMonths(12) `
        -FriendlyName 'Weekend Search local HTTPS'
    $password = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    $securePassword = ConvertTo-SecureString -String $password -AsPlainText -Force
    Export-PfxCertificate -Cert $certificate -FilePath $pfxPath -Password $securePassword | Out-Null
    Export-Certificate -Cert $certificate -FilePath $publicPath | Out-Null
    Set-Content -LiteralPath $passwordPath -Value $password -NoNewline -Encoding utf8
    Set-Content -LiteralPath $thumbprintPath -Value $certificate.Thumbprint -NoNewline -Encoding ascii
}

$thumbprint = (Get-Content -LiteralPath $thumbprintPath -Raw).Trim()
if ($Trust -and -not (Test-Path -LiteralPath "Cert:\CurrentUser\Root\$thumbprint")) {
    Import-Certificate -FilePath $publicPath -CertStoreLocation 'Cert:\CurrentUser\Root' | Out-Null
}

Write-Output 'Local certificate is ready for https://127.0.0.1:5174/ and https://localhost:5174/.'
Write-Output "Trusted for this Windows user: $(Test-Path -LiteralPath "Cert:\CurrentUser\Root\$thumbprint")"
Write-Output "Certificate files: $certificateDirectory"
