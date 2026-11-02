$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$csc = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
& $csc /nologo /optimize+ /target:exe /platform:anycpu "/reference:$projectRoot\engines\pkg\LibOrbisPkg.dll" "/out:$projectRoot\engines\pkg\kaliw-pkg.exe" "$projectRoot\native\kaliw-pkg.cs"
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar importador PKG' }

