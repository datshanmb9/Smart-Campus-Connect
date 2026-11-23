$adb = "C:\Users\darsh\AppData\Local\Android\Sdk\platform-tools\adb.exe"

Write-Host "Starting persistent ADB reverse daemon on port 5000 for all attached devices..."
while ($true) {
    try {
        $lines = & $adb devices
        foreach ($line in $lines) {
            if ($line -match '^(\S+)\s+device$') {
                $dev = $matches[1]
                & $adb -s $dev reverse tcp:5000 tcp:5000 2>&1 | Out-Null
            }
        }
    } catch {}
    Start-Sleep -Seconds 3
}
