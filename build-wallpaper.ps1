npm run build
$wall = Join-Path $PWD "out\wallpaper"
if (Test-Path $wall) {
  Write-Host "Export complete ? $wall"
  ii $wall
} else {
  Write-Error "Exported wallpaper not found."
}


