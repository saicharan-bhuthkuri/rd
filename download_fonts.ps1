$fonts = @{
    "Cardo-Regular.ttf" = "https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Regular.ttf"
    "Cardo-Bold.ttf" = "https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Bold.ttf"
    "Cardo-Italic.ttf" = "https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Italic.ttf"
    "BebasNeue-Regular.ttf" = "https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf"
    "Bebas Neue Bold.ttf" = "https://github.com/dharmatype/Bebas-Neue/raw/master/fonts/BebasNeue(2014)ByFontFabric/BebasNeue-Bold.ttf"
}

$destDir = Join-Path $PSScriptRoot "fonts"
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

Write-Host "Downloading custom fonts for templates..." -ForegroundColor Cyan

foreach ($name in $fonts.Keys) {
    $url = $fonts[$name]
    $destPath = Join-Path $destDir $name
    if (Test-Path $destPath) {
        Write-Host "  $name already downloaded." -ForegroundColor Green
    } else {
        Write-Host "  Downloading $name..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $destPath
    }
}

Write-Host "`nFonts downloaded successfully to: $destDir" -ForegroundColor Green
Write-Host "Opening fonts folder in Explorer..." -ForegroundColor Cyan

Start-Process explorer.exe -ArgumentList $destDir

Write-Host "`nINSTRUCTIONS TO INSTALL:" -ForegroundColor Cyan
Write-Host "1. In the Explorer window that just opened, select all the font files (Ctrl+A)."
Write-Host "2. Right-click the selection."
Write-Host "3. Click 'Install' (or 'Install for all users')."
Write-Host "4. Restart the backend server for changes to take effect." -ForegroundColor Yellow
