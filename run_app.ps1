$rscript = $null

$cmd = Get-Command Rscript -ErrorAction SilentlyContinue
if ($cmd) {
  $rscript = $cmd.Source
}

if (-not $rscript) {
  $searchRoots = @(
    "C:\Program Files\R",
    "C:\Program Files (x86)\R",
    (Join-Path $env:LOCALAPPDATA "Programs\R")
  )
  foreach ($root in $searchRoots) {
    if (Test-Path $root) {
      $candidate = Get-ChildItem $root -Filter Rscript.exe -Recurse -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1 -ExpandProperty FullName
      if ($candidate) {
        $rscript = $candidate
        break
      }
    }
  }
}

if (-not $rscript) {
  throw "Rscript.exe not found. Install R or add Rscript to PATH, then rerun this script."
}

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDirForR = $appDir -replace '\\', '/'

& $rscript -e "shiny::runApp('$appDirForR', launch.browser = TRUE)"
