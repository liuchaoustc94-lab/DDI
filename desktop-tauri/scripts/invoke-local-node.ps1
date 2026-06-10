param(
  [Parameter(Mandatory = $true)]
  [string]$EntryScript,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ScriptArgs
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopDir = (Resolve-Path (Join-Path $scriptDir "..")).Path
$appDir = (Resolve-Path (Join-Path $desktopDir "..\\app")).Path
$bundledNodeDir = Get-ChildItem (Join-Path $appDir ".tools") -Directory -Filter "node-*" -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1

if ($bundledNodeDir) {
  $nodeExe = Join-Path $bundledNodeDir.FullName "node.exe"
} else {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($null -eq $nodeCommand) {
    Write-Error "Node.js runtime not found. Install Node.js or restore app/.tools/node-*/node.exe."
    exit 1
  }

  $nodeExe = $nodeCommand.Source
}

$entryPath = (Resolve-Path (Join-Path $desktopDir $EntryScript)).Path

& $nodeExe $entryPath @ScriptArgs
exit $LASTEXITCODE
