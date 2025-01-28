import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

interface CustomCopyCommand {
    name: string;
    script: string;
    description?: string;
}

async function loadGitignore(workspaceRoot: string): Promise<ReturnType<typeof ignore>> {
    const ig = ignore();
    const gitignorePath = path.join(workspaceRoot, '.gitignore');
    
    try {
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ig.add(gitignoreContent);
        }
    } catch (error) {
        console.error('Error loading .gitignore:', error);
    }
    
    return ig;
}


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

class ConfigTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        if (command) {
            this.command = command;
        }
    }
}

class ConfigTreeDataProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ConfigTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private config: vscode.Memento) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConfigTreeItem): Thenable<ConfigTreeItem[]> {
        if (!element) {
            return Promise.resolve([
                // Copy buttons section
                new ConfigTreeItem(
                    'Copy Actions',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'copyActions'
                ),
                // Filter sections
                new ConfigTreeItem(
                    'Enabled Project Types',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'projectTypes'
                ),
                new ConfigTreeItem(
                    'Custom Extensions',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'customExtensions'
                )
            ]);
        }
    
        if (element.contextValue === 'copyActions') {
            return Promise.resolve([
                new ConfigTreeItem(
                    'Copy All Open Files',
                    vscode.TreeItemCollapsibleState.None,
                    'copyCommand',
                    {
                        command: 'copy-code.copyAllFiles',
                        title: 'Copy All Open Files'
                    }
                ),
                new ConfigTreeItem(
                    'Copy All Project Files',
                    vscode.TreeItemCollapsibleState.None,
                    'copyCommand',
                    {
                        command: 'copy-code.copyAllProjectFiles',
                        title: 'Copy All Project Files'
                    }
                )
            ]);
        }

        const currentConfig = this.getConfig();

        if (element.contextValue === 'projectTypes') {
            return Promise.resolve(
                Object.keys(DEFAULT_EXTENSIONS).map(type => {
                    const enabled = currentConfig.enabledProjectTypes.includes(type);
                    return new ConfigTreeItem(
                        `${enabled ? '✓ ' : '○ '}${type}`,
                        vscode.TreeItemCollapsibleState.None,
                        'projectType',
                        {
                            command: 'copy-code.toggleProjectType',
                            title: 'Toggle Project Type',
                            arguments: [type]
                        }
                    );
                })
            );
        }

        if (element.contextValue === 'customExtensions') {
            const items = currentConfig.customExtensions.map(ext => 
                new ConfigTreeItem(
                    ext,
                    vscode.TreeItemCollapsibleState.None,
                    'customExtension'
                )
            );
            items.push(new ConfigTreeItem(
                'Add Custom Extension',
                vscode.TreeItemCollapsibleState.None,
                'addCustom',
                {
                    command: 'copy-code.addCustomExtension',
                    title: 'Add Custom Extension'
                }
            ));
            return Promise.resolve(items);
        }

        return Promise.resolve([]);
    }
    
    public getConfig(): CopyCodeConfig {
        const savedConfig = this.config.get<CopyCodeConfig>('copyCodeConfig');
        return savedConfig || {
            enabledProjectTypes: ['powershell', 'python', 'node'],
            customExtensions: []
        };
    }

    public async saveConfig(newConfig: CopyCodeConfig): Promise<void> {
        await this.config.update('copyCodeConfig', newConfig);
        this.refresh();
    }
}

















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

async function copyAllProjectFiles(context: vscode.ExtensionContext): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders?.length) {
            vscode.window.showInformationMessage('No workspace folder open');
            return;
        }

        const config = getConfig(context);
        const allowedExtensions = getAllowedExtensions(config);
        const filesToCopy: string[] = [];

        for (const folder of workspaceFolders) {
            const ig = await loadGitignore(folder.uri.fsPath);
            
            function searchFiles(dir: string, root: string): void {
                const files = fs.readdirSync(dir);
                
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const relativePath = path.relative(root, fullPath);
                    
                    // Skip if file is ignored by .gitignore
                    if (ig.ignores(relativePath)) {
                        continue;
                    }

                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        searchFiles(fullPath, root);
                    } else if (stat.isFile()) {
                        const ext = path.extname(file);
                        if (allowedExtensions.has(ext)) {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            filesToCopy.push(`=== ${relativePath} ===\n${content}\n`);
                        }
                    }
                }
            }

            searchFiles(folder.uri.fsPath, folder.uri.fsPath);
        }

        await vscode.env.clipboard.writeText(filesToCopy.join('\n'));
        vscode.window.showInformationMessage(`Copied ${filesToCopy.length} files`);
    } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
    }
}

export function registerCustomCopyCommand(context: vscode.ExtensionContext, command: CustomCopyCommand): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(`copy-code.custom.${command.name}`, async () => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
                const resolvedScript = command.script.replace('${workspaceFolder}', workspaceFolder || '');
                
                const process = require('child_process');
                process.exec(`powershell.exe -File "${resolvedScript}"`, (error: any, stdout: string) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Script error: ${error}`);
                        return;
                    }
                    vscode.window.showInformationMessage(`Command "${command.name}" executed successfully`);
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        })
    );
}

export async function addCustomCopyCommand(context: vscode.ExtensionContext): Promise<void> {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter command name'
    });
    
    if (!name) return;

    const script = await vscode.window.showInputBox({
        prompt: 'Enter PowerShell script path',
        placeHolder: 'e.g., ${workspaceFolder}/scripts/copy.ps1'
    });
    
    if (!script) return;

    const description = await vscode.window.showInputBox({
        prompt: 'Enter command description (optional)'
    });

    const customCommands = context.globalState.get<CustomCopyCommand[]>('customCopyCommands', []);
    customCommands.push({ name, script, description });
    await context.globalState.update('customCopyCommands', customCommands);

    registerCustomCopyCommand(context, { name, script, description });
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

export function activate(context: vscode.ExtensionContext): void {
    const treeDataProvider = new ConfigTreeDataProvider(context.globalState);
    vscode.window.registerTreeDataProvider('copy-code-actions', treeDataProvider);


    

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copy-code.copyAllFiles', () => {
            copyAllOpenFiles(context);
            treeDataProvider.refresh(); 
        }),
        vscode.commands.registerCommand('copy-code.copyAllProjectFiles', () => {
            copyAllProjectFiles(context);
            treeDataProvider.refresh();
        }),
        vscode.commands.registerCommand('copy-code.addCustomCommand', () => {
            addCustomCopyCommand(context);
        }),
        vscode.commands.registerCommand('copy-code.configureExtensions', async () => {
            await configureExtensions(context);
            treeDataProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('copy-code.toggleProjectType', async (type: string) => {
            const currentConfig = treeDataProvider.getConfig();
            const index = currentConfig.enabledProjectTypes.indexOf(type);
            
            if (index === -1) {
                currentConfig.enabledProjectTypes.push(type);
            } else {
                currentConfig.enabledProjectTypes.splice(index, 1);
            }
            
            await treeDataProvider.saveConfig(currentConfig);
        }),
        
        vscode.commands.registerCommand('copy-code.addCustomExtension', async () => {
            const extension = await vscode.window.showInputBox({
                prompt: 'Enter file extension (e.g., .txt)',
                validateInput: value => {
                    if (!value.startsWith('.')) {
                        return 'Extension must start with a dot (.)';
                    }
                    return null;
                }
            });
            
            if (extension) {
                const currentConfig = treeDataProvider.getConfig();
                currentConfig.customExtensions.push(extension);
                await treeDataProvider.saveConfig(currentConfig);
            }
        })
    );

    console.log('Congratulations, your extension "copy-code" is now active!');
}