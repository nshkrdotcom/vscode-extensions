import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Interface for the extension's configuration
interface CopyCodeConfig {
    enabledProjectTypes: string[];
    customExtensions: string[];
}

// Default file extensions for supported project types
const DEFAULT_EXTENSIONS: Record<string, string[]> = {
    powershell: ['.ps1', '.psm1', '.psd1'],
    terraform: ['.tf', '.tfvars'],
    bash: ['.sh', '.bash', '.zsh'],
    php: ['.php', '.phtml', '.php3', '.php4', '.php5', '.php7', '.php8'],
    mysql: ['.sql', '.mysql'],
    postgres: ['.sql', '.pgsql'],
    elixir: ['.ex', '.exs'],
    python: ['.py', '.pyw', '.pyi'],
    node: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.node'],
    vscode: ['.json', '.yml', '.yaml'],
    wsl2: ['.sh', '.bash', '.zsh', '.ps1']
};

// Utility function to get the extension's configuration
function getConfig(context: vscode.ExtensionContext): CopyCodeConfig {
    const config = context.globalState.get<CopyCodeConfig>('copyCodeConfig');
    return config || {
        enabledProjectTypes: ['powershell', 'python', 'node'],
        customExtensions: []
    };
}

// Utility function to save the extension's configuration
function saveConfig(context: vscode.ExtensionContext, newConfig: CopyCodeConfig): Thenable<void> {
    return context.globalState.update('copyCodeConfig', newConfig);
}

// Utility function to get all allowed file extensions based on the configuration
function getAllowedExtensions(config: CopyCodeConfig): Set<string> {
    const extensions = new Set<string>();
    config.enabledProjectTypes.forEach(type => {
        DEFAULT_EXTENSIONS[type]?.forEach(ext => extensions.add(ext));
    });
    config.customExtensions.forEach(ext => extensions.add(ext.startsWith('.') ? ext : `.${ext}`));
    return extensions;
}

// Function to copy content from all open files
async function copyAllOpenFiles(context: vscode.ExtensionContext): Promise<void> {
    try {
        const textDocuments = vscode.workspace.textDocuments;

        if (textDocuments.length === 0) {
            vscode.window.showInformationMessage('No open files found.');
            return;
        }
        
        const validDocs = textDocuments.filter(doc => {
            // Skip untitled or empty files
            if (doc.isUntitled || doc.getText().trim().length === 0) {
              return false;
            }

            // Skip git-related files using a more comprehensive check
            const lowerCaseFileName = doc.fileName.toLowerCase();
            if (lowerCaseFileName.includes('.git/') || lowerCaseFileName.includes('.git\\') || lowerCaseFileName.endsWith('.git')) {
                return false;
            }

            return true;
        });
        
        if (validDocs.length === 0) {
            vscode.window.showInformationMessage('No valid open files found to copy.');
            return;
        }

        const contents = validDocs.map(doc => {
            const relativePath = vscode.workspace.asRelativePath(doc.fileName);
            return `=== ${relativePath} ===\n${doc.getText()}\n`;
        }).join('\n');

        await vscode.env.clipboard.writeText(contents);
        vscode.window.showInformationMessage(`Copied content from ${validDocs.length} open files to clipboard.`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy content from open files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Error in copyAllOpenFiles:', error);
    }
}

// Function to copy content from project files based on configuration
async function copyAllProjectFiles(context: vscode.ExtensionContext): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showInformationMessage('No workspace folder open.');
            return;
        }

        const config = getConfig(context);
        const allowedExtensions = getAllowedExtensions(config);

        const filesToCopy: string[] = [];

        // Recursive function to search for files in a directory
        function searchFiles(dir: string, root: string): void {
            const files = fs.readdirSync(dir);

            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && file !== '.git') {
                    searchFiles(fullPath, root);
                } else if (stat.isFile()) {
                    const ext = path.extname(file);
                    if (allowedExtensions.has(ext)) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            filesToCopy.push(`=== ${path.relative(root, fullPath)} ===\n${content}\n`);
                        } catch (readError) {
                            console.error(`Error reading file ${fullPath}:`, readError);
                        }
                    }
                }
            });
        }

        // Iterate through each workspace folder (for multi-root workspaces)
        for (const folder of workspaceFolders) {
            searchFiles(folder.uri.fsPath, folder.uri.fsPath);
        }

        if (filesToCopy.length === 0) {
            vscode.window.showInformationMessage('No project files found matching the configured extensions.');
            return;
        }

        const contents = filesToCopy.join('\n');
        await vscode.env.clipboard.writeText(contents);
        vscode.window.showInformationMessage(`Copied content from ${filesToCopy.length} project files to clipboard.`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy content from project files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Error in copyAllProjectFiles:', error);
    }
}

// Function to configure the extension's settings
async function configureExtensions(context: vscode.ExtensionContext): Promise<void> {
    const currentConfig = getConfig(context);

    const projectTypePicks = Object.keys(DEFAULT_EXTENSIONS).map(type => ({
        label: type,
        picked: currentConfig.enabledProjectTypes.includes(type)
    }));

    const selectedTypes = await vscode.window.showQuickPick(projectTypePicks, {
        canPickMany: true,
        title: 'Select Project Types to Include'
    });

    if (selectedTypes) {
        const customExtInput = await vscode.window.showInputBox({
            prompt: 'Enter any additional file extensions (comma-separated, without dots)',
            value: currentConfig.customExtensions.join(', ')
        });

        const newConfig: CopyCodeConfig = {
            enabledProjectTypes: selectedTypes.map(pick => pick.label),
            customExtensions: customExtInput ? customExtInput.split(',').map(ext => ext.trim()).filter(ext => ext) : []
        };

        await saveConfig(context, newConfig);
        vscode.window.showInformationMessage('Extension configuration updated successfully.');
    }
}


// Deactivate function - called when the extension is deactivated
export function deactivate(): void {
    // Clean up resources if needed
}


// Minimal TreeDataProvider (no data)
class NoDataProvider implements vscode.TreeDataProvider<string> {
    getTreeItem(element: string): vscode.TreeItem {
        return new vscode.TreeItem(element);
    }
    getChildren(element?: string): Thenable<string[]> {
        return Promise.resolve([]); // No children
    }
}

// Activate function - entry point of the extension
export function activate(context: vscode.ExtensionContext): void {
    console.log('Congratulations, your extension "copy-code" is now active!');

    // Register Tree Data Provider
    const treeDataProvider = new NoDataProvider();
    vscode.window.registerTreeDataProvider('copy-code-actions', treeDataProvider); // Use your view ID

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copy-code.copyAllFiles', () => copyAllOpenFiles(context)),
        vscode.commands.registerCommand('copy-code.copyAllProjectFiles', () => copyAllProjectFiles(context)),
        vscode.commands.registerCommand('copy-code.configureExtensions', () => configureExtensions(context))
    );
}
