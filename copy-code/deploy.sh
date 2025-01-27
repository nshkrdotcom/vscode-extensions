#!/bin/bash

echo "In your copy-code directory's package.json, you need to add scripts for building and packaging. Here's how to modify your package.json:"
echo "jsonCopy{"
echo "  \"scripts\": {"
echo "    \"compile\": \"tsc -p ./\","
echo "    \"watch\": \"tsc -watch -p ./\","
echo "    \"package\": \"vsce package\","
echo "    \"vscode:prepublish\": \"npm run compile\""
echo "  }"
echo "}"

npm run compile  # First compile the TypeScript
npm run package  # Then create the .vsix package

echo "If you get any errors about vsce not being found, you'll need to install it:"
echo "npm install -g @vscode/vsce"
echo "In VS Code, install extension from vsix, and pick the copy-code-x.x.x.vsix"
