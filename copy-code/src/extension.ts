import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Default file extension whitelist for different project types
const DEFAULT_EXTENSIONS: { [key: string]: string[] } = {
    'powershell': ['.ps1', '.psm1', '.psd1'],
    'terraform': ['.tf', '.tfvars'],
    'bash': ['.sh', '.bash', '.zsh'],
    'php': ['.php', '.phtml', '.php3', '.php4', '.php5', '.php7', '.php8'],
    'mysql': ['.sql', '.mysql'],
    'postgres': ['.sql', '.pgsql'],
    'elixir': ['.ex', '.exs'],
    'python': ['.py', '.pyw', '.pyi'],
    'node': ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.node'],
    'vscode': ['.json', '.yml', '.yaml'],
    'wsl2': ['.sh', '.bash', '.zsh', '.ps1']
};

interface CopyCodeConfig {
    enabledProjectTypes: string[];
    customExtensions: string[];
}

export function activate(context: vscode.ExtensionContext) {
    // Configuration management
    const config = context.globalState;

    // Initialize or load configuration
    function getConfig(): CopyCodeConfig {
        const savedConfig = config.get<CopyCodeConfig>('copyCodeConfig');
        return savedConfig || {
            enabledProjectTypes: ['powershell', 'python', 'node'], // Default enabled project types
            customExtensions: [] // Custom extensions can be added here
        };
    }

    // Save configuration
    function saveConfig(newConfig: CopyCodeConfig): Promise<void> {
        // Convert Thenable to Promise
        return Promise.resolve(config.update('copyCodeConfig', newConfig));
    }

    // Get all allowed file extensions
    function getAllowedExtensions(config: CopyCodeConfig): string[] {
        const extensions = new Set<string>();
        
        // Add extensions from enabled project types
        config.enabledProjectTypes.forEach(type => {
            DEFAULT_EXTENSIONS[type]?.forEach(ext => extensions.add(ext));
        });

        // Add custom extensions
        config.customExtensions.forEach(ext => extensions.add(ext.startsWith('.') ? ext : `.${ext}`));

        return Array.from(extensions);
    }

    // Command to copy content of ALL open files
    let disposableCopyAllFiles = vscode.commands.registerCommand('copy-code.copyAllFiles', async () => {
        try {
            // Get ALL text documents across ALL open editors
            const allTextDocuments = vscode.workspace.textDocuments;
            
            // More aggressive filtering to ensure we capture as many files as possible
            const validDocs = allTextDocuments.filter(doc => {
                // Ensure the document is not null or undefined
                if (!doc) return false;

                // Skip temporary or unsaved files
                if (doc.isUntitled) return false;

                // Skip empty files
                const content = doc.getText().trim();
                if (content.length === 0) return false;

                // Skip git-related files
                const fileName = doc.fileName.toLowerCase();
                if (fileName.includes('.git') || fileName.includes('git/') || fileName.includes('git\\')) return false;

                return true;
            });

            if (validDocs.length === 0) {
                vscode.window.showInformationMessage('No valid open files found');
                return;
            }

            // Collect contents from all valid documents
            const contents = validDocs.map(doc => {
                // Try to get a meaningful relative path, fallback to filename
                const relativePath = vscode.workspace.asRelativePath(doc.fileName || 'Unknown File');
                return `=== ${relativePath} ===\n${doc.getText()}\n`;
            }).join('\n');

            await vscode.env.clipboard.writeText(contents);
            vscode.window.showInformationMessage(`Copied content from ${validDocs.length} files to clipboard`);
        } catch (error) {
            console.error('Error in copyAllFiles:', error);
            vscode.window.showErrorMessage(`Failed to copy files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Configure extensions command
    let disposableConfigureExtensions = vscode.commands.registerCommand('copy-code.configureExtensions', async () => {
        const currentConfig = getConfig();

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
                customExtensions: customExtInput
                    ? customExtInput.split(',').map(ext => ext.trim())
                    : []
            };

            await saveConfig(newConfig);
            vscode.window.showInformationMessage('Extension configuration updated successfully');
        }
    });

    // Project files copy command
    let disposableCopyProjectFiles = vscode.commands.registerCommand('copy-code.copyAllProjectFiles', async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            
            // Enhanced null and length checking
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showInformationMessage('No workspace folder open');
                return;
            }
    
            const currentConfig = getConfig();
            const allowedExtensions = getAllowedExtensions(currentConfig);
    
            const filesToCopy: string[] = [];
    
            // Recursive file search function with safe workspace root extraction
            function searchFiles(dir: string, workspaceRoot: string) {
                const files = fs.readdirSync(dir);
    
                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
    
                    if (stat.isDirectory() && file !== '.git') {
                        searchFiles(fullPath, workspaceRoot);
                    } else if (stat.isFile()) {
                        const ext = path.extname(file);
                        if (allowedExtensions.includes(ext)) {
                            try {
                                // Use the passed workspaceRoot instead of accessing workspaceFolders
                                const content = fs.readFileSync(fullPath, 'utf8');
                                filesToCopy.push(`=== ${path.relative(workspaceRoot, fullPath)} ===\n${content}\n`);
                            } catch (readError) {
                                console.error(`Error reading file ${fullPath}:`, readError);
                            }
                        }
                    }
                });
            }
    
            // Safely extract the first workspace folder's path
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
            // Start searching from the first workspace folder
            searchFiles(workspaceRoot, workspaceRoot);
    
            if (filesToCopy.length === 0) {
                vscode.window.showInformationMessage('No files found matching the configured extensions');
                return;
            }
    
            const contents = filesToCopy.join('\n');
            await vscode.env.clipboard.writeText(contents);
            vscode.window.showInformationMessage(`Copied content from ${filesToCopy.length} files`);
        } catch (error) {
            console.error('Error in copyAllProjectFiles:', error);
            vscode.window.showErrorMessage(`Error copying project files: ${error}`);
        }
    });

    // Create a tree view for configuration
    const treeDataProvider = new class implements vscode.TreeDataProvider<TreeItem> {
        private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
        readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

        getTreeItem(element: TreeItem): vscode.TreeItem {
            return element;
        }

        getChildren(): TreeItem[] {
            return [
                new TreeItem('Copy All Files', {
                    command: 'copy-code.copyAllFiles',
                    title: 'Copy All Files Content',
                    arguments: []
                }, new vscode.ThemeIcon('files')),
                new TreeItem('Configure Extensions', {
                    command: 'copy-code.configureExtensions',
                    title: 'Configure File Extensions',
                    arguments: []
                }, new vscode.ThemeIcon('settings-gear'))
            ];
        }
    };

    // Custom TreeItem class to support commands
    class TreeItem extends vscode.TreeItem {
        constructor(
            public readonly label: string,
            public readonly command?: vscode.Command,
            public readonly iconPath?: vscode.ThemeIcon
        ) {
            super(label, vscode.TreeItemCollapsibleState.None);
            this.command = command;
        }
    }

    // Register the tree view
    vscode.window.createTreeView('copy-code-actions', {
        treeDataProvider
    });

    // Add subscriptions
    context.subscriptions.push(
        disposableCopyAllFiles,
        disposableCopyProjectFiles,
        disposableConfigureExtensions
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}