$ErrorActionPreference = 'Stop'

try {
    npm run compile
    vsce package
    vsce publish
} catch {
    Write-Error "Publishing failed: $_"
    exit 1
}