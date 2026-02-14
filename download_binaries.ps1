# Binance Downloader Script for Windows

$binDir = "bin"
if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Force -Path $binDir
}

# Download yt-dlp
Write-Host "Downloading yt-dlp.exe..."
Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile "$binDir/yt-dlp.exe"

# Download ffmpeg (using gyan.dev essentials build)
Write-Host "Downloading ffmpeg..."
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipFile = "ffmpeg.zip"

Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipFile

Write-Host "Extracting ffmpeg..."
Expand-Archive -Path $zipFile -DestinationPath "ffmpeg_temp" -Force

# Move binaries to bin/
$extractedDir = Get-ChildItem -Path "ffmpeg_temp" | Where-Object { $_.PSIsContainer } | Select-Object -First 1
Move-Item -Path "$($extractedDir.FullName)/bin/ffmpeg.exe" -Destination "$binDir/ffmpeg.exe" -Force
Move-Item -Path "$($extractedDir.FullName)/bin/ffprobe.exe" -Destination "$binDir/ffprobe.exe" -Force

# Cleanup
Remove-Item -Path $zipFile -Force
Remove-Item -Path "ffmpeg_temp" -Recurse -Force

Write-Host "Binaries acquired successfully in $binDir"
