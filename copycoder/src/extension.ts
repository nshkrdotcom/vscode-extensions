import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

import { ClipboardProcessor } from './clipboardProcessor';

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

// Define default blacklisted files for each project type
const DEFAULT_BLACKLIST: { [key: string]: string[] } = {
    'node': [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.npmrc',
        '.yarnrc',
        '.pnpmrc'
    ],
    'python': [
        'Pipfile.lock',
        'poetry.lock',
        '__pycache__',
        '*.pyc',
        '.pytest_cache'
    ],
    'terraform': [
        '.terraform.lock.hcl',
        'terraform.tfstate',
        'terraform.tfstate.backup'
    ],
    'vscode': [
        '*.vsix',
        '.vscodeignore'
    ],
    'powershell': [
        '*.psd1',  // Module manifest files
        '*.psm1'   // Module files
    ]
};

// Update the CopyCodeConfig interface to include blacklist
interface CopyCodeConfig {
    enabledProjectTypes: string[];
    customExtensions: string[];
    customBlacklist: string[];  // New field for custom blacklisted files
}


interface CustomCopyCommand {
    name: string;
    script: string;
    description?: string;
}

// The file scanning logic is separated to make the main function clearer
interface FileScanResult {
    files: { path: string; content: string }[];
    hasGitignore: boolean;
}




class ConfigTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly command?: vscode.Command,
        public readonly typeId?: string
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        if (command) {
            this.command = command;
        }
        
        // Set up the icon and theme color
        const iconInfo = this.getIconInfo();
        this.iconPath = new vscode.ThemeIcon(iconInfo.name, iconInfo.color);
    }

    private getIconInfo(): { name: string; color?: vscode.ThemeColor } {
        switch (this.contextValue) {
            case 'copyActions':
                return { name: 'files' };
            case 'projectTypes':
                return { name: 'folder' };
            case 'projectType':
                return { 
                    name: this.label.startsWith('✓') ? 'folder-active' : 'folder'
                };
            case 'blacklist':
                return { name: 'list-filter' };
            case 'blacklistItem':
                return { 
                    name: 'circle-slash',
                    color: new vscode.ThemeColor('errorForeground')  // Uses VS Code's built-in error color
                };
            case 'defaultBlacklistItem':
                return { 
                    name: 'circle-slash',
                    color: new vscode.ThemeColor('errorForeground')
                };
            case 'customExtension':
                return { name: 'symbol-file' };
            case 'addCustom':
            case 'addBlacklist':
                return { name: 'add' };
            default:
                return { name: 'file' };
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

    async getChildren(element?: ConfigTreeItem): Promise<ConfigTreeItem[]> {
        const currentConfig = this.getConfig();

        if (!element) {
            return this.getRootItems();
        }
        
        switch (element.contextValue) {
            case 'projectTypes':
                return this.getProjectTypeItems(currentConfig);
                
            case 'projectType':
                if (element.typeId) {
                    console.log(`Loading blacklist for ${element.typeId}`);
                    const defaultBlacklist = DEFAULT_BLACKLIST[element.typeId] || [];
                    // Use our helper function for default blacklist items
                    return defaultBlacklist.map(pattern => this.getBlacklistItems(pattern, true));
                }
                return [];
            
            case 'blacklist':
                const customItems = (currentConfig.customBlacklist || []).map(pattern => 
                    // Use our helper function for custom blacklist items
                    this.getBlacklistItems(pattern, false)
                );
                
                // Add the "Add Pattern" button at the end
                customItems.push(new ConfigTreeItem(
                    '+ Add Pattern',
                    vscode.TreeItemCollapsibleState.None,
                    'addBlacklist',
                    {
                        command: 'copycoder.addBlacklistPattern',
                        title: 'Add Pattern'
                    }
                ));
                
                return customItems;

            case 'copyActions':
                return [
                    new ConfigTreeItem(
                        'Copy All Open Files',
                        vscode.TreeItemCollapsibleState.None,
                        'copyCommand',
                        {
                            command: 'copycoder.copyAllFiles',
                            title: 'Copy All Open Files'
                        }
                    ),
                    new ConfigTreeItem(
                        'Copy All Project Files',
                        vscode.TreeItemCollapsibleState.None,
                        'copyCommand',
                        {
                            command: 'copycoder.copyAllProjectFiles',
                            title: 'Copy All Project Files'
                        }
                    )
                ];

            case 'customExtensions':
                console.log('Custom extensions:', currentConfig.customExtensions);
                const extItems = (currentConfig.customExtensions || []).map(ext => 
                    new ConfigTreeItem(
                        ext,
                        vscode.TreeItemCollapsibleState.None,
                        'customExtension'
                    )
                );
                extItems.push(new ConfigTreeItem(
                    '+ Add Custom Extension',
                    vscode.TreeItemCollapsibleState.None,
                    'addCustom',
                    {
                        command: 'copycoder.addCustomExtension',
                        title: 'Add Custom Extension'
                    }
                ));
                return extItems;

            default:
                return [];
        }
    }

    private getRootItems(): ConfigTreeItem[] {
        return [
            new ConfigTreeItem('Copy Actions', vscode.TreeItemCollapsibleState.Expanded, 'copyActions'),
            new ConfigTreeItem('Project Types', vscode.TreeItemCollapsibleState.Expanded, 'projectTypes'),
            new ConfigTreeItem('Custom Extensions', vscode.TreeItemCollapsibleState.Expanded, 'customExtensions'), 
            new ConfigTreeItem('Blacklisted Files', vscode.TreeItemCollapsibleState.Expanded, 'blacklist')
        ];
     }

     private getProjectTypeItems(config: CopyCodeConfig): ConfigTreeItem[] {
        return Object.keys(DEFAULT_EXTENSIONS).map(type => {
            const enabled = config.enabledProjectTypes.includes(type);
            const defaultBlacklist = DEFAULT_BLACKLIST[type] || [];
            const label = `${enabled ? '✓' : '○'} ${type}${defaultBlacklist.length > 0 ? ` (${defaultBlacklist.length} blocked)` : ''}`;
            
            return new ConfigTreeItem(
                label,
                defaultBlacklist.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                'projectType',
                {
                    command: 'copycoder.toggleProjectType',
                    title: 'Toggle Project Type',
                    arguments: [type]
                },
                type
            );
        });
    }

    private getBlacklistItems(pattern: string, isDefault: boolean = true): ConfigTreeItem {
        // Create a descriptive label that shows if it's a default rule
        const label = isDefault ? `${pattern} (default)` : pattern;
        
        // For custom blacklist items, we want to allow removal
        const command = !isDefault ? {
            command: 'copycoder.removeBlacklistPattern',
            title: 'Remove Pattern',
            arguments: [pattern]
        } : undefined;

        return new ConfigTreeItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            isDefault ? 'defaultBlacklistItem' : 'blacklistItem',
            command
        );
    }

    public getConfig(): CopyCodeConfig {
        const savedConfig = this.config.get<CopyCodeConfig>('copyCodeConfig');
        const defaultConfig = {
            enabledProjectTypes: ['powershell', 'python', 'node'],
            customExtensions: [],
            customBlacklist: []
        };
        
        return savedConfig ? {
            ...defaultConfig,
            ...savedConfig,
            customBlacklist: savedConfig.customBlacklist || []
        } : defaultConfig;
    }

    public async saveConfig(newConfig: CopyCodeConfig): Promise<void> {
        await this.config.update('copyCodeConfig', newConfig);
        this.refresh();
    }
}












async function loadGitignore(workspaceRoot: string): Promise<{ ig: ReturnType<typeof ignore>, hasGitignore: boolean }> {
    const ig = ignore();
    const gitignorePath = path.join(workspaceRoot, '.gitignore');
    let hasGitignore = false;
    
    try {
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ig.add(gitignoreContent);
            hasGitignore = true;
        }
    } catch (error) {
        console.error('Error loading .gitignore:', error);
    }
    
    return { ig, hasGitignore };
}






// Utility function to get the extension's configuration
function getConfig(context: vscode.ExtensionContext): CopyCodeConfig {
    const config = context.globalState.get<CopyCodeConfig>('copyCodeConfig');
    return config || {
        enabledProjectTypes: ['powershell', 'python', 'node'],
        customExtensions: [],
        customBlacklist: []  // Include the new required property
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
        // Collect all text editor file paths using the Tab API
        const filesToCopy: vscode.Uri[] = [];

        for (const tabGroup of vscode.window.tabGroups.all) {
            for (const tab of tabGroup.tabs) {
                // Ensure we only capture text file tabs
                if (tab.input instanceof vscode.TabInputText) {
                    filesToCopy.push(tab.input.uri);
                }
            }
        }

        if (filesToCopy.length === 0) {
            vscode.window.showInformationMessage('No open files to copy.');
            return;
        }

        // Read and compile file contents
        const fileContents = await Promise.all(
            filesToCopy.map(async (uri) => {
                const document = await vscode.workspace.openTextDocument(uri);
                const relativePath = vscode.workspace.asRelativePath(uri);
                return `=== ${relativePath} ===\n${document.getText()}\n`;
            })
        );

        // Combine and copy to clipboard
        const finalContent = fileContents.join('\n');
        await vscode.env.clipboard.writeText(finalContent);
        
        vscode.window.showInformationMessage(
            `Copied content from ${filesToCopy.length} file(s) to clipboard.`
        );

    } catch (error) {
        console.error('Error in copyAllOpenFiles:', error);
        vscode.window.showErrorMessage(`Failed to copy files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to get all blacklisted files based on config
function getBlacklistedFiles(config: CopyCodeConfig): Set<string> {
    const blacklist = new Set<string>();
    
    // Ensure config has required properties
    const safeConfig = {
        enabledProjectTypes: config?.enabledProjectTypes || [],
        customBlacklist: config?.customBlacklist || [],
        customExtensions: config?.customExtensions || []
    };
    
    // Add blacklisted files from enabled project types
    safeConfig.enabledProjectTypes.forEach(type => {
        DEFAULT_BLACKLIST[type]?.forEach(file => blacklist.add(file));
    });
    
    // Add custom blacklisted files
    safeConfig.customBlacklist.forEach(file => blacklist.add(file));
    
    return blacklist;
}

// Update the file scanning function to use the blacklist
function shouldIncludeFile(
    filename: string,
    allowedExtensions: Set<string>,
    blacklist: Set<string>
): boolean {
    // Check if file is blacklisted (exact match or wildcard)
    for (const pattern of blacklist) {
        if (pattern.includes('*')) {
            // Simple wildcard matching
            const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
            if (regex.test(filename)) {
                return false;
            }
        } else if (filename === pattern) {
            return false;
        }
    }
    
    // Check if extension is allowed
    const ext = path.extname(filename);
    return allowedExtensions.has(ext);
}

async function scanWorkspaceFiles(
    workspaceFolders: readonly vscode.WorkspaceFolder[],
    config: CopyCodeConfig
): Promise<FileScanResult> {
    const safeConfig: CopyCodeConfig = {
        enabledProjectTypes: config?.enabledProjectTypes || [],
        customExtensions: config?.customExtensions || [],
        customBlacklist: config?.customBlacklist || []
    };    
    const allowedExtensions = getAllowedExtensions(config);
    const blacklist = getBlacklistedFiles(config);
    const filesToCopy: { path: string; content: string }[] = [];
    let hasAnyGitignore = false;

    for (const folder of workspaceFolders) {
        const { ig, hasGitignore } = await loadGitignore(folder.uri.fsPath);
        hasAnyGitignore = hasAnyGitignore || hasGitignore;
        
        function searchFiles(dir: string, root: string): void {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const relativePath = path.relative(root, fullPath);
                
                // Skip if file is ignored by .gitignore
                if (hasGitignore && ig.ignores(relativePath)) {
                    continue;
                }

                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    if (file === 'node_modules' || file === '.git') {
                        continue;
                    }
                    searchFiles(fullPath, root);
                } else if (stat.isFile()) {
                    // Use new shouldIncludeFile function
                    if (shouldIncludeFile(file, allowedExtensions, blacklist)) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        filesToCopy.push({
                            path: relativePath,
                            content: content
                        });
                    }
                }
            }
        }

        searchFiles(folder.uri.fsPath, folder.uri.fsPath);
    }

    return {
        files: filesToCopy,
        hasGitignore: hasAnyGitignore
    };
}

// Main function with sequential warning handling
async function copyAllProjectFiles(context: vscode.ExtensionContext): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders?.length) {
            vscode.window.showInformationMessage('No workspace folder open');
            return;
        }

        const config = getConfig(context);
        
        // Pass the entire config object
        const scanResult = await scanWorkspaceFiles(workspaceFolders, config);
        
        if (!scanResult?.files) {
            vscode.window.showInformationMessage('No files found to copy');
            return;
        }

        if (scanResult.files.length === 0) {
            vscode.window.showInformationMessage('No matching files found to copy.');
            return;
        }

        if (!scanResult.hasGitignore) {
            const gitignoreWarning = await vscode.window.showWarningMessage(
                'Warning: No .gitignore file found. All matching files will be included.',
                'Proceed',
                'Cancel'
            );
            
            if (gitignoreWarning !== 'Proceed') {
                return;
            }
        }

        const FILE_THRESHOLD = 50;
        if (scanResult.files.length > FILE_THRESHOLD) {
            const manyFilesWarning = await vscode.window.showWarningMessage(
                `Warning: You are about to copy ${scanResult.files.length} files. This is more than the recommended limit of ${FILE_THRESHOLD} files.`,
                'Proceed',
                'Cancel'
            );
            
            if (manyFilesWarning !== 'Proceed') {
                return;
            }
        }

        const finalContent = scanResult.files
            .map(file => `=== ${file.path} ===\n${file.content}\n`)
            .join('\n');

        await vscode.env.clipboard.writeText(finalContent);
        vscode.window.showInformationMessage(
            `Successfully copied ${scanResult.files.length} files to clipboard`
        );

    } catch (error) {
        console.error('Error in copyAllProjectFiles:', error);
        vscode.window.showErrorMessage(
            `Error: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

export function registerCustomCopyCommand(context: vscode.ExtensionContext, command: CustomCopyCommand): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(`copycoder.custom.${command.name}`, async () => {
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
            customExtensions: customExtInput ? customExtInput.split(',').map(ext => ext.trim()).filter(ext => ext) : [],
            customBlacklist: currentConfig.customBlacklist  // Preserve existing blacklist
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
    console.log('Activating extension');
    
    const treeDataProvider = new ConfigTreeDataProvider(context.globalState);
    const treeView = vscode.window.createTreeView('copycoder-actions', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });
    
    context.subscriptions.push(treeView);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copycoder.copyAllFiles', () => {
            copyAllOpenFiles(context);
            treeDataProvider.refresh();
        }),
        
        vscode.commands.registerCommand('copycoder.copyAllProjectFiles', () => {
            copyAllProjectFiles(context);
            treeDataProvider.refresh();
        }),
        
        vscode.commands.registerCommand('copycoder.toggleProjectType', async (type: string) => {
            console.log('Toggling project type:', type);
            const currentConfig = treeDataProvider.getConfig();
            const index = currentConfig.enabledProjectTypes.indexOf(type);
            
            if (index === -1) {
                currentConfig.enabledProjectTypes.push(type);
            } else {
                currentConfig.enabledProjectTypes.splice(index, 1);
            }
            
            await treeDataProvider.saveConfig(currentConfig);
        }),
        
        vscode.commands.registerCommand('copycoder.addCustomExtension', async () => {
            const extension = await vscode.window.showInputBox({
                prompt: 'Enter file extension (e.g., .txt)',
                validateInput: value => {
                    if (!value?.startsWith('.')) {
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
        }),

        vscode.commands.registerCommand('copycoder.addBlacklistPattern', async () => {
            const pattern = await vscode.window.showInputBox({
                prompt: 'Enter filename pattern to blacklist',
                placeHolder: '*.log or config.json'
            });
            
            if (pattern) {
                const currentConfig = treeDataProvider.getConfig();
                currentConfig.customBlacklist.push(pattern);
                await treeDataProvider.saveConfig(currentConfig);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('copycoder.parseClipboard', () => {
            ClipboardProcessor.processClipboardContent();
        })
    );

    console.log('Extension activated successfully');
}