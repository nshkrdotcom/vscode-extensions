# Enhanced deploy.ps1
# Increment version in package.json
$packageJson = Get-Content .\package.json | ConvertFrom-Json
$currentVersion = $packageJson.version
$versionParts = $currentVersion.Split('.')
$versionParts[2] = ([int]$versionParts[2] + 1).ToString()
$newVersion = $versionParts -join '.'
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json | Set-Content .\package.json

# Compile TypeScript
npm run compile

# Remove old .vsix files to prevent confusion
Remove-Item *.vsix -ErrorAction SilentlyContinue

# Package the extension
npm run package

Write-Output "Extension packaged with version $newVersion"

# Install in Windows VSCode
Write-Output "Installing extension in VSCode for Windows environment."
$vsixFile = Get-Item *.vsix | Select-Object -First 1
code --install-extension $vsixFile.FullName

# Convert Windows path for WSL
$windowsPath = (Get-Item .).FullName
$driveLetter = $windowsPath[0].ToString().ToLower()
$wslPath = "/mnt/$driveLetter" + ($windowsPath.Substring(2) -replace '\\', '/')

Write-Output "Installing extension in WSL from location: $wslPath/$($vsixFile.Name)"
wsl -d udev2404 code --install-extension "$wslPath/$($vsixFile.Name)"