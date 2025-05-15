// src/services/fileService.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import { CopyCodeConfig, DEFAULT_EXTENSIONS, DEFAULT_BLACKLIST, FileScanResult } from '../models';

export class FileService {
    private readonly fs: typeof fs;

    constructor(fsModule: typeof fs = fs) {
        this.fs = fsModule;
    }

    /**
     * Gets all allowed file extensions based on the configuration
     */
    public getAllowedExtensions(config: CopyCodeConfig): Set<string> {
        const extensions = new Set<string>();
        if (config.includeGlobalExtensions) {
            DEFAULT_EXTENSIONS['global']?.forEach(ext => extensions.add(ext));
        }
        config.enabledProjectTypes.forEach(type => {
            DEFAULT_EXTENSIONS[type]?.forEach(ext => extensions.add(ext));
        });
        config.customExtensions.forEach(ext => extensions.add(ext.startsWith('.') ? ext : `.${ext}`));
        return extensions;
    }

    /**
     * Gets all blacklisted files based on configuration
     */
    public getBlacklistedFiles(config: CopyCodeConfig): Set<string> {
        const blacklist = new Set<string>();

        if (config.applyGlobalBlacklist) {
            DEFAULT_BLACKLIST['global']?.forEach(pattern => blacklist.add(pattern));
        }
        
        // Add blacklisted files from enabled project types
        config.enabledProjectTypes.forEach(type => {
            DEFAULT_BLACKLIST[type]?.forEach(file => blacklist.add(file));
        });
        
        // Add custom blacklisted files
        config.customBlacklist.forEach(file => blacklist.add(file));
        
        return blacklist;
    }

    /**
     * Loads .gitignore file from workspace
     */
    public async loadGitignore(workspaceRoot: string): Promise<{ ig: ReturnType<typeof ignore>, hasGitignore: boolean }> {
        const ig = ignore();
        const gitignorePath = path.join(workspaceRoot, '.gitignore');
        let hasGitignore = false;
        
        try {
            if (this.fs.existsSync(gitignorePath)) {
                const gitignoreContent = this.fs.readFileSync(gitignorePath, 'utf8');
                ig.add(gitignoreContent);
                hasGitignore = true;
            }
        } catch (error) {
            console.error('Error loading .gitignore:', error);
        }
        
        return { ig, hasGitignore };
    }

    /**
     * Determines if a file should be included based on extension and blacklist
     */
    public shouldIncludeFile(
        filename: string,
        fullPath: string,
        allowedExtensions: Set<string>,
        blacklist: Set<string>
    ): boolean {
        // Check if file is blacklisted (exact match or wildcard)
        for (const pattern of blacklist) {
            // Handle directory patterns (e.g., "node_modules/*")
            if (pattern.endsWith('/*')) {
                const dirPattern = pattern.slice(0, -2); // Remove "/*"
                const regex = new RegExp(`^${dirPattern}/.*`);
                if (regex.test(fullPath)) {
                    return false;
                }
            } else if (pattern.includes('*')) {
                // Wildcard pattern (e.g., "*.min.js")
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                if (regex.test(filename)) {
                    return false;
                }
            } else if (filename === pattern) {
                // Exact match
                return false;
            }
        }
        
        // Check if extension is allowed
        const ext = path.extname(filename);
        return allowedExtensions.has(ext);
    }

    /**
     * Scans workspace files based on configuration
     */
    public async scanWorkspaceFiles(
        workspaceFolders: readonly vscode.WorkspaceFolder[],
        config: CopyCodeConfig
    ): Promise<FileScanResult> {
        const allowedExtensions = this.getAllowedExtensions(config);
        const blacklist = this.getBlacklistedFiles(config);
        const filesToCopy: { path: string; content: string }[] = [];
        let hasAnyGitignore = false;
        for (const folder of workspaceFolders) {
            const { ig, hasGitignore } = await this.loadGitignore(folder.uri.fsPath);
            hasAnyGitignore = hasAnyGitignore || hasGitignore;
            
            const searchFiles = (dir: string, root: string): void => {
                const files = this.fs.readdirSync(dir);
                
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const relativePath = path.relative(root, fullPath);
                    
                    // Skip if file is ignored by .gitignore
                    if (hasGitignore && ig.ignores(relativePath)) {
                        continue;
                    }

                    const stat = this.fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (file === 'node_modules' || file === '.git') {
                            continue;
                        }
                        searchFiles(fullPath, root);
                    } else if (stat.isFile()) {
                        if (this.shouldIncludeFile(file, fullPath, allowedExtensions, blacklist)) {
                            const content = this.fs.readFileSync(fullPath, 'utf8');
                            filesToCopy.push({
                                path: relativePath,
                                content: content
                            });
                        }
                    }
                }
            };

            searchFiles(folder.uri.fsPath, folder.uri.fsPath);
        }

        return {
            files: filesToCopy,
            hasGitignore: hasAnyGitignore
        };
    }
}