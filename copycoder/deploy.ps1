# Increment version in package.json
$packageJson = Get-Content .\package.json | ConvertFrom-Json
$currentVersion = $packageJson.version
$versionParts = $currentVersion.Split('.')
$versionParts[2] = ([int]$versionParts[2] + 1).ToString()
$newVersion = $versionParts -join '.'
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 4 | Set-Content .\package.json

# Compile TypeScript
npm run compile

# Remove old .vsix files
Remove-Item *.vsix -ErrorAction SilentlyContinue

# Package the extension using vsce
vsce package

Write-Output "Extension packaged with version $newVersion"

# Get the .vsix file path (assuming only one is created)
$vsixFile = Get-Item *.vsix
if (-not $vsixFile) {
    Write-Error "No .vsix file found after packaging."
    exit 1
}

# Install in Windows VSCode
Write-Output "Installing extension in VSCode for Windows environment."
code --install-extension $vsixFile.FullName

# Convert Windows path to WSL path
$windowsPath = (Get-Item .).FullName
$driveLetter = $windowsPath[0].ToString().ToLower()
$wslPath = "/mnt/$driveLetter" + ($windowsPath.Substring(2) -replace '\\', '/')

Write-Output "Installing extension in WSL from location: $wslPath/$($vsixFile.Name)"
wsl -d udev2404 code --install-extension "$wslPath/$($vsixFile.Name)"

git add ../.
git commit -m "Version: ($vsixFile.Name)"
git push