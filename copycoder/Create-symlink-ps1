# Create-symlink.ps1

# Ensure we're running with administrator privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "This script needs to be run as Administrator to create symlinks"
    exit 1
}

# Function to create symlink for an extension
function New-ExtensionSymlink {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ExtensionName
    )
    
    $sourcePath = "$PSScriptRoot\$ExtensionName"
    $targetPath = "$env:USERPROFILE\.vscode\extensions\my-extensions\$ExtensionName"
    
    # Verify source exists
    if (!(Test-Path $sourcePath)) {
        Write-Error "Source extension directory does not exist: $sourcePath"
        return
    }
    
    # Create parent directory if it doesn't exist
    $parentDir = Split-Path $targetPath -Parent
    if (!(Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force
    }
    
    # Create or update symlink
    if (Test-Path $targetPath) {
        Remove-Item $targetPath -Force
    }
    
    New-Item -ItemType SymbolicLink -Path $targetPath -Target $sourcePath -Force
    Write-Host "Created symlink for $ExtensionName"
    Write-Host "Source: $sourcePath"
    Write-Host "Target: $targetPath"
}

# Example usage when script is run directly
if ($MyInvocation.InvocationName -ne ".") {
    # Check if extension name was provided as parameter
    if ($args.Count -eq 0) {
        Write-Host "Usage: .\create-symlink.ps1 extension-name"
        exit 1
    }
    
    New-ExtensionSymlink -ExtensionName $args[0]
}