# In your copy-code directory's package.json, you need to add scripts for building and packaging. Here's how to modify your package.json:
# jsonCopy{
#   "scripts": {
#     "compile": "tsc -p ./",
#     "watch": "tsc -watch -p ./",
#     "package": "vsce package",
#     "vscode:prepublish": "npm run compile"
#   }
# }

npm run compile  # First compile the TypeScript
npm run package  # Then create the .vsix package

Write-Output "If you get any errors about vsce not being found, you'll need to install it:"
Write-Output "npm install -g @vscode/vsce"
Write-Output "In VS Code, install extension from vsix, and pick the copy-code-x.x.x.vsix"

# In Windows PowerShell
Write-Output "Installing extension in VSCode for your windows environment."
code --install-extension copy-code-0.0.1.vsix

# Convert Windows path to WSL path
$windowsPath = (Get-Item .).FullName
$driveLetter = $windowsPath[0].ToString().ToLower()
$wslPath = "/mnt/$driveLetter" + ($windowsPath.Substring(2) -replace '\\', '/')

Write-Output "Installing extension in wsl from location: $wslPath/copy-code-0.0.1.vsix"
wsl -d udev2404 code --install-extension "$wslPath/copy-code-0.0.1.vsix"