import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

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
                    'Project Types',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'projectTypes'
                ),
                new ConfigTreeItem(
                    'Custom Extensions',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'customExtensions'
                ),
                // New blacklist section
                new ConfigTreeItem(
                    'Blacklisted Files',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'blacklist'
                )
            ]);
        }
    
        const currentConfig = this.getConfig();

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

        if (element.contextValue === 'projectTypes') {
            return Promise.resolve(
                Object.keys(DEFAULT_EXTENSIONS).map(type => {
                    const enabled = currentConfig.enabledProjectTypes.includes(type);
                    const defaultBlacklist = DEFAULT_BLACKLIST[type] || [];
                    return new ConfigTreeItem(
                        `${enabled ? '✓' : '○'} ${type} (${defaultBlacklist.length} blacklist rules)`,
                        vscode.TreeItemCollapsibleState.Collapsed,
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

        // Show default blacklist for project types
        if (element.contextValue === 'projectType') {
            const type = element.label.split(' ')[1]; // Extract type from label
            const defaultBlacklist = DEFAULT_BLACKLIST[type] || [];
            return Promise.resolve(
                defaultBlacklist.map(pattern => 
                    new ConfigTreeItem(
                        `${pattern} (default)`,
                        vscode.TreeItemCollapsibleState.None,
                        'defaultBlacklistItem'
                    )
                )
            );
        }

        if (element.contextValue === 'customExtensions') {
            const items = currentConfig.customExtensions.map(ext => 
                new ConfigTreeItem(
                    ext,
                    vscode.TreeItemCollapsibleState.None,
                    'customExtension',
                    {
                        command: 'copy-code.removeCustomExtension',
                        title: 'Remove Extension',
                        arguments: [ext]
                    }
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

        // New section for blacklist items
        if (element.contextValue === 'blacklist') {
            const items = currentConfig.customBlacklist.map(pattern => 
                new ConfigTreeItem(
                    pattern,
                    vscode.TreeItemCollapsibleState.None,
                    'blacklistItem',
                    {
                        command: 'copy-code.removeBlacklistItem',
                        title: 'Remove from Blacklist',
                        arguments: [pattern]
                    }
                )
            );
            items.push(new ConfigTreeItem(
                'Add Blacklist Pattern',
                vscode.TreeItemCollapsibleState.None,
                'addBlacklist',
                {
                    command: 'copy-code.addBlacklistPattern',
                    title: 'Add Blacklist Pattern'
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
            customExtensions: [],
            customBlacklist: []
        };
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


// Function to get all blacklisted files based on config
function getBlacklistedFiles(config: CopyCodeConfig): Set<string> {
    const blacklist = new Set<string>();
    
    // Add blacklisted files from enabled project types
    config.enabledProjectTypes.forEach(type => {
        DEFAULT_BLACKLIST[type]?.forEach(file => blacklist.add(file));
    });
    
    // Add custom blacklisted files
    config.customBlacklist.forEach(file => blacklist.add(file));
    
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
        // Initial workspace check
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders?.length) {
            vscode.window.showInformationMessage('No workspace folder open');
            return;
        }

        // Get configuration and scan files
        const config = getConfig(context);
        const allowedExtensions = getAllowedExtensions(config);
        
        // Scan workspace and get results
        const scanResult = await scanWorkspaceFiles(workspaceFolders, config);
        
        // Handle no files found early
        if (scanResult.files.length === 0) {
            vscode.window.showInformationMessage('No matching files found to copy.');
            return;
        }

        // Sequential warning handling
        
        // 1. First warning: Missing .gitignore
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

        // 2. Second warning: Too many files (if applicable)
        const FILE_THRESHOLD = 50; // Adjust this number based on your needs
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

        // If we get here, user has confirmed all warnings
        // Prepare the final content
        const finalContent = scanResult.files
            .map(file => `=== ${file.path} ===\n${file.content}\n`)
            .join('\n');

        // Copy to clipboard
        await vscode.env.clipboard.writeText(finalContent);
        vscode.window.showInformationMessage(
            `Successfully copied ${scanResult.files.length} files to clipboard`
        );

    } catch (error) {
        vscode.window.showErrorMessage(
            `Error: ${error instanceof Error ? error.message : String(error)}`
        );
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
    const treeDataProvider = new ConfigTreeDataProvider(context.globalState);
    vscode.window.registerTreeDataProvider('copy-code-actions', treeDataProvider);

    // Register existing commands...

    // Add new blacklist-related commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copy-code.addBlacklistPattern', async () => {
            const pattern = await vscode.window.showInputBox({
                prompt: 'Enter filename pattern to blacklist (e.g., "*.log" or "config.json")',
                placeHolder: 'Filename or pattern',
                validateInput: value => {
                    if (!value) {
                        return 'Pattern cannot be empty';
                    }
                    return null;
                }
            });
            
            if (pattern) {
                const currentConfig = treeDataProvider.getConfig();
                if (!currentConfig.customBlacklist.includes(pattern)) {
                    currentConfig.customBlacklist.push(pattern);
                    await treeDataProvider.saveConfig(currentConfig);
                }
            }
        }),

        vscode.commands.registerCommand('copy-code.removeBlacklistPattern', async (pattern: string) => {
            const currentConfig = treeDataProvider.getConfig();
            const index = currentConfig.customBlacklist.indexOf(pattern);
            if (index !== -1) {
                currentConfig.customBlacklist.splice(index, 1);
                await treeDataProvider.saveConfig(currentConfig);
            }
        }),

        // Add command to remove custom extensions
        vscode.commands.registerCommand('copy-code.removeCustomExtension', async (extension: string) => {
            const currentConfig = treeDataProvider.getConfig();
            const index = currentConfig.customExtensions.indexOf(extension);
            if (index !== -1) {
                currentConfig.customExtensions.splice(index, 1);
                await treeDataProvider.saveConfig(currentConfig);
            }
        })
    );

    // Register a new command to show blacklist summary
    context.subscriptions.push(
        vscode.commands.registerCommand('copy-code.showBlacklistSummary', async () => {
            const currentConfig = treeDataProvider.getConfig();
            let message = 'Current Blacklist Configuration:\n\n';
            
            // Show enabled project types and their default blacklist
            message += 'Project-specific blacklist rules:\n';
            currentConfig.enabledProjectTypes.forEach(type => {
                const rules = DEFAULT_BLACKLIST[type] || [];
                message += `${type}: ${rules.join(', ')}\n`;
            });
            
            // Show custom blacklist patterns
            message += '\nCustom blacklist patterns:\n';
            message += currentConfig.customBlacklist.length > 0 
                ? currentConfig.customBlacklist.join(', ')
                : 'None';
            
            await vscode.window.showInformationMessage(message, { modal: true });
        })
    );

    console.log('Congratulations, your extension "copy-code" is now active!');
}