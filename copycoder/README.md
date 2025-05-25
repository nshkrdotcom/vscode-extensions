# CopyCoder (v0.2.3)

CopyCoder is a VS Code extension designed to easily copy your code for sharing with AI assistants like Claude, GPT, or other LLMs. It provides an easy way to prepare your code context for prompting by formatting multiple files into a clipboard-ready format.

## Features

- **Copy Open Files**: Copy all currently open files in your editor to your clipboard with proper formatting
- **Copy All Files**: Copy all files in your workspace based on configured filters
- **Gitignore Support**: Option to automatically filter files based on your .gitignore file
- **Project Type Presets**: Built-in configuration for different project types (Node.js, Python, VSCode, etc.)
- **File Extension Filtering**: Configure which file types to include based on project type
- **Blacklist Support**: Exclude specific files or patterns from being copied

## Installation

You can install CopyCoder from the VS Code marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "CopyCoder"
4. Click Install

## Usage

CopyCoder adds a sidebar view with quick actions:

1. Click on the CopyCoder icon in the activity bar
2. Use the buttons in the sidebar to:
   - Copy Open Files: Copy all currently open files
   - Copy All Files: Copy all project files (based on your configuration)

You can also access these commands from the Command Palette (Ctrl+Shift+P):
- `CopyCoder: Copy Open Files`
- `CopyCoder: Copy All Files`

## Extension Settings

CopyCoder supports the following configuration options:

- `includeGlobalExtensions`: Include global file extensions in all project types
- `filterUsingGitignore`: Automatically filter files based on .gitignore patterns
- `projectTypes`: Active project types to determine which file extensions to include
- `globalExtensions`: File extensions to include globally across all project types
- `customExtensions`: Custom file extensions for each project type
- `globalBlacklist`: Patterns to exclude globally across all project types
- `customBlacklist`: Custom exclusion patterns for each project type

## Supported Project Types

CopyCoder comes preconfigured with settings for these project types:
- Node.js
- Python
- VS Code Extension
- PowerShell
- Terraform
- Bash
- PHP
- MySQL
- PostgreSQL
- Elixir
- WSL2

## Release Notes

### 0.2.3

- Fix typo in README.md

### 0.2.2

- Revamped gitignore filter to use git command
- Fixed extensions to allow prepended extensions (.ext) and wildcards (*.ext)

### 0.2.1

- Fixed "Copy Open Files" feature to properly handle multiple editor tabs
- Added proper support for gitignore-based filtering
- Centralized all configuration into a single source of truth
- Improved glob pattern handling for file exclusions
- Enhanced debugging logs throughout the codebase
- Fixed issues with file path handling on different platforms
- Added fallback mechanisms for IDE testing environments
- Improved error handling and user feedback

### 0.1.0

- Initial release of CopyCoder
- Basic file copying functionality
- Project type configuration
- Extension filtering

## Feedback and Contributions

- File bugs or feature requests.

## License

This extension is licensed under the MIT License.

**Enjoy using CopyCoder!**
