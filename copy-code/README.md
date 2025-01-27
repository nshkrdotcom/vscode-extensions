# VS Code Extensions Development

This repository contains multiple VS Code extensions. The setup is designed to make development and testing of multiple extensions straightforward while maintaining proper isolation and configuration for each extension.

## Initial Setup

Run these PowerShell commands to set up the development environment:

```powershell
# Create the main extensions directory in VS Code if it doesn't exist
New-Item -ItemType Directory -Path "$env:USERPROFILE\.vscode\extensions\my-extensions" -Force

# Create symlinks for each extension
# You'll need to run this for each new extension you create
function New-ExtensionSymlink {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ExtensionName
    )
    
    $sourcePath = "$PSScriptRoot\$ExtensionName"
    $targetPath = "$env:USERPROFILE\.vscode\extensions\my-extensions\$ExtensionName"
    
    if (!(Test-Path $sourcePath)) {
        Write-Error "Source extension directory does not exist: $sourcePath"
        return
    }
    
    New-Item -ItemType SymbolicLink -Path $targetPath -Target $sourcePath -Force
    Write-Host "Created symlink for $ExtensionName"
}

# Example usage:
# New-ExtensionSymlink -ExtensionName "copy-code"
```

## Creating a New Extension

When creating a new extension, follow these steps:

1. Create the extension:
```powershell
# Navigate to repository root
cd your-repo-root

# Create new extension directory
mkdir new-extension-name
cd new-extension-name

# Initialize extension
npm install -g yo generator-code
yo code  # Choose TypeScript when prompted
```

2. Set up extension-specific VS Code settings. Create `.vscode/settings.json` in your extension directory:
```json
{
    "typescript.tsdk": "./node_modules/typescript/lib",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "typescript.preferences.importModuleSpecifier": "relative"
}
```

3. Create a symlink for the new extension:
```powershell
# From repository root
. .\create-symlink.ps1  # Source the script
New-ExtensionSymlink -ExtensionName "new-extension-name"
```

4. Add the extension to the workspace file (`vscode-extensions.code-workspace`):
```json
{
    "folders": [
        {
            "name": "Copy Code Extension",
            "path": "copy-code"
        },
        {
            "name": "New Extension",
            "path": "new-extension-name"
        }
    ]
}
```

## Development Workflow

1. Open the workspace:
```powershell
code vscode-extensions.code-workspace
```

2. Select the extension you want to work on in the workspace explorer

3. Press F5 to launch the Extension Development Host for testing

4. Make changes and test:
   - Edit code in the extension's `src/extension.ts`
   - Changes are automatically compiled
   - Press Ctrl+R in Extension Development Host to reload
   - Check Debug Console for logs and errors

5. After making changes:
   - Run `npm run compile` in the extension directory
   - Restart your regular VS Code to use the updated version

## Extension Organization

Each extension should maintain its own:
- `.vscode/settings.json` for extension-specific settings
- `package.json` for extension metadata and dependencies
- `tsconfig.json` for TypeScript configuration
- `src/` directory for source code
- `.gitignore` for extension-specific ignored files

The workspace configuration helps manage all extensions while maintaining their independence.