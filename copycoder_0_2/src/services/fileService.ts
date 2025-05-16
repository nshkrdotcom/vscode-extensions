import * as vscode from 'vscode';
import { FileSystem } from './fileSystem';
import { Config } from '../models/config';
import * as path from 'path';

export interface FileContent {
  path: string;
  content: string;
}

export class FileService {
  constructor(private readonly fileSystem: FileSystem) {}

  async scanWorkspaceFiles(config: Config, workspaceRoot: string = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''): Promise<FileContent[]> {
    if (!workspaceRoot) {
      console.log('FileService.scanWorkspaceFiles - No workspace root provided');
      return [];
    }

    const files: FileContent[] = [];
    const patterns = this.buildPatterns(config);

    console.log('FileService.scanWorkspaceFiles - Config filterUsingGitignore:', config.filterUsingGitignore);
    console.log('FileService.scanWorkspaceFiles - Got patterns:', {
      extensions: patterns.extensions,
      blacklist: patterns.blacklist
    });

    // Check if we have any extensions to match
    if (patterns.extensions.length === 0) {
      console.log('FileService.scanWorkspaceFiles - No extensions to match, returning empty array');
      return [];
    }

    // Build the include pattern for file extensions
    // Format: **/*.js, **/*.ts, etc.
    const includePatterns = patterns.extensions.map(ext => {
      // Ensure the extension starts with a dot
      const cleanExt = ext.startsWith('.') ? ext.substring(1) : ext;
      return `**/*.${cleanExt}`;
    });
    
    // VS Code wants include patterns in braces if there are multiple
    const includePattern = includePatterns.length === 1 
      ? includePatterns[0]
      : (includePatterns.length > 1 ? `{${includePatterns.join(',')}}` : '');
    
    console.log(`FileService.scanWorkspaceFiles - Using include pattern: ${includePattern}`);

    // Build the exclude pattern for blacklisted files/directories
    let excludePatterns: string[] = [];
    
    // Process each blacklist pattern to proper VS Code glob format
    patterns.blacklist.forEach(pattern => {
      // Handle patterns ending with /* to match directories
      if (pattern.endsWith('/*')) {
        excludePatterns.push(`**/${pattern}`);
      }
      // Handle patterns with wildcards
      else if (pattern.includes('*')) {
        excludePatterns.push(`**/${pattern}`);
      }
      // Regular files/directories
      else {
        excludePatterns.push(`**/${pattern}/**`);
        // Also match the file/directory itself
        excludePatterns.push(`**/${pattern}`); 
      }
    });

    // Add gitignore patterns if enabled
    if (config.filterUsingGitignore) {
      console.log('FileService.scanWorkspaceFiles - filterUsingGitignore is TRUE, processing .gitignore');
      const gitignorePatterns = this.parseGitignore(workspaceRoot);
      
      if (gitignorePatterns.length > 0) {
        gitignorePatterns.forEach(pattern => {
          // Skip empty patterns
          if (!pattern) return;
          
          console.log(`FileService.scanWorkspaceFiles - Processing gitignore pattern: "${pattern}"`);
          
          // Convert gitignore pattern to VS Code glob pattern
          if (pattern.includes('*')) {
            // Pattern already has wildcard
            excludePatterns.push(`**/${pattern}`);
          } 
          else if (pattern.endsWith('/')) {
            // Directory pattern (ends with /)
            excludePatterns.push(`**/${pattern}**`);
          } 
          else {
            // Could be file or directory, add both patterns
            excludePatterns.push(`**/${pattern}/**`); // Match as directory
            excludePatterns.push(`**/${pattern}`);    // Match as file
          }
        });
      }
      
      // Always exclude node_modules and .git when using gitignore
      if (!excludePatterns.includes('**/node_modules/**')) {
        excludePatterns.push('**/node_modules/**');
      }
      if (!excludePatterns.includes('**/.git/**')) {
        excludePatterns.push('**/.git/**');
      }
      
      console.log(`FileService.scanWorkspaceFiles - Added ${gitignorePatterns.length} gitignore patterns`);
    } else {
      console.log('FileService.scanWorkspaceFiles - filterUsingGitignore is FALSE, skipping .gitignore');
    }
    
    // Format the exclude pattern for VS Code
    const excludePattern = excludePatterns.length > 0 
      ? `{${excludePatterns.join(',')}}`
      : undefined;

    console.log('FileService.scanWorkspaceFiles - workspaceRoot:', workspaceRoot);
    console.log('FileService.scanWorkspaceFiles - includePattern:', includePattern);
    console.log('FileService.scanWorkspaceFiles - excludePattern:', excludePattern);
    console.log(`FileService.scanWorkspaceFiles - excludePatterns (${excludePatterns.length}):`, excludePatterns);

    try {
      // Use VS Code API to find files matching our patterns
      console.log(`FileService.scanWorkspaceFiles - Calling workspace.findFiles with includePattern: "${includePattern}", excludePattern: "${excludePattern || 'none'}"`);
      
      const uris = excludePattern
        ? await vscode.workspace.findFiles(includePattern, excludePattern)
        : await vscode.workspace.findFiles(includePattern);
      
      console.log(`FileService.scanWorkspaceFiles - found ${uris.length} files matching patterns`);
      
      for (const uri of uris) {
        const relativePath = vscode.workspace.asRelativePath(uri, false);
        console.log(`FileService.scanWorkspaceFiles - processing ${relativePath}`);
        
        try {
          const content = this.fileSystem.readFileSync(uri.fsPath, 'utf-8');
          files.push({ path: relativePath, content });
          console.log(`FileService.scanWorkspaceFiles - added ${relativePath} to results`);
        } catch (error) {
          console.error(`Error reading file ${uri.fsPath}: ${error}`);
        }
      }
    } catch (error) {
      console.error(`Failed to scan files: ${error}`);
      throw new Error(`Failed to scan files: ${error}`);
    }

    console.log(`FileService.scanWorkspaceFiles - returning ${files.length} files`);
    return files;
  }

  getAllowedExtensions(config: Config): Set<string> {
    const extensions = config.includeGlobalExtensions
      ? [...config.globalExtensions]
      : [];
    config.projectTypes.forEach(pt => {
      extensions.push(...(config.customExtensions[pt] || []));
    });
    return new Set(extensions);
  }

  getBlacklistedFiles(config: Config): Set<string> {
    const blacklist = [...config.globalBlacklist];
    config.projectTypes.forEach(pt => {
      blacklist.push(...(config.customBlacklist[pt] || []));
    });
    if (config.filterUsingGitignore) {
      blacklist.push('node_modules', '.git');
    }
    return new Set(blacklist);
  }

  shouldIncludeFile(filename: string, filePath: string, allowedExtensions: Set<string>, blacklistedFiles: Set<string>): boolean {
    const ext = path.extname(filename).toLowerCase();
    console.log('FileService.shouldIncludeFile - inputs:', { filename, filePath, ext, allowedExtensions: [...allowedExtensions], blacklistedFiles: [...blacklistedFiles] });

    if (ext === '' && allowedExtensions.has(filename.toLowerCase())) {
      console.log(`FileService.shouldIncludeFile: Including ${filePath} (no extension, allowed)`);
      return true;
    }
    if (!allowedExtensions.has(ext) && ext !== '') {
      console.log(`FileService.shouldIncludeFile: Excluding ${filePath} (extension ${ext} not allowed)`);
      return false;
    }

    const isBlacklisted = [...blacklistedFiles].some((pattern: string) => filePath.includes(pattern));
    console.log('FileService.shouldIncludeFile - isBlacklisted:', isBlacklisted, 'for pattern check on:', filePath);
    if (isBlacklisted) {
      console.log(`FileService.shouldIncludeFile: Excluding ${filePath} (blacklisted)`);
    }
    return !isBlacklisted;
  }

  parseGitignore(workspaceRoot: string): string[] {
    const gitignorePath = path.join(workspaceRoot, '.gitignore').replace(/\\/g, '/');
    console.log(`FileService.parseGitignore - Looking for gitignore at: ${gitignorePath}`);
    
    if (!this.fileSystem.existsSync(gitignorePath)) {
      console.log('FileService.parseGitignore - No .gitignore file found');
      return [];
    }
    
    try {
      const content = this.fileSystem.readFileSync(gitignorePath, 'utf-8');
      console.log(`FileService.parseGitignore - Read .gitignore with ${content.split('\n').length} lines`);
      
      // Parse the gitignore content
      const patterns = content
        .split('\n')
        .map(line => line.trim())
        // Skip empty lines or comments
        .filter(line => line && !line.startsWith('#'))
        // Handle paths
        .map(line => {
          // Remove trailing slashes for directories
          let pattern = line.replace(/\/$/, '').replace(/\\/g, '/');
          
          // Handle negated patterns (we'll ignore these for now)
          if (pattern.startsWith('!')) {
            console.log(`FileService.parseGitignore - Ignoring negated pattern: ${pattern}`);
            return '';
          }
          
          // Handle leading slashes (anchored to root)
          if (pattern.startsWith('/')) {
            pattern = pattern.substring(1);
          }
          
          return pattern;
        })
        .filter(Boolean); // Remove empty patterns
      
      console.log(`FileService.parseGitignore - Parsed ${patterns.length} valid patterns`);
      return patterns;
    } catch (error) {
      console.error(`Error reading .gitignore: ${error}`);
      return [];
    }
  }


  getFiles(workspaceRoot: string, config: Config): FileContent[] {
    const files: FileContent[] = [];
    const allowedExtensions = this.getAllowedExtensions(config);
    const blacklistedFiles = this.getBlacklistedFiles(config);
    const gitignorePatterns = config.filterUsingGitignore ? this.parseGitignore(workspaceRoot) : [];
    
    console.log('FileService.getFiles - workspaceRoot:', workspaceRoot);
    console.log('FileService.getFiles - allowedExtensions:', [...allowedExtensions]);
    console.log('FileService.getFiles - blacklistedFiles:', [...blacklistedFiles]);
    console.log('FileService.getFiles - gitignorePatterns:', gitignorePatterns);
    console.log('FileService.getFiles - filterUsingGitignore:', config.filterUsingGitignore);

    const walkDir = (dir: string) => {
      if (!this.fileSystem.existsSync(dir)) {
        console.log('FileService.getFiles - directory does not exist:', dir);
        return;
      }

      let entries: string[] = [];
      try {
        entries = this.fileSystem.readdirSync(dir);
        console.log('FileService.getFiles - readdirSync entries for', dir, ':', entries);
      } catch (error) {
        console.error(`Error reading directory ${dir}: ${error}`);
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry).replace(/\\/g, '/');
        const relativePath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
        console.log('FileService.getFiles - processing entry:', { entry, fullPath, relativePath });

        // Check gitignore patterns
        if (config.filterUsingGitignore && gitignorePatterns.some(pattern => relativePath.includes(pattern))) {
          console.log(`FileService.getFiles - excluding ${relativePath} (gitignore)`);
          continue;
        }

        // Check blacklist
        if (blacklistedFiles.has(entry) || blacklistedFiles.has(relativePath)) {
          console.log(`FileService.getFiles - excluding ${relativePath} (blacklisted)`);
          continue;
        }

        // Check if it's a directory
        const isDirectory = (this.fileSystem as any).isDirectory?.(fullPath) ?? false;
        console.log('FileService.getFiles - isDirectory for', fullPath, ':', isDirectory);
        if (isDirectory) {
          walkDir(fullPath);
          continue;
        }

        // Check file extension and blacklist
        console.log('FileService.getFiles - checking shouldIncludeFile for', { entry, relativePath });
        if (this.shouldIncludeFile(entry, relativePath, allowedExtensions, blacklistedFiles)) {
          try {
            const content = this.fileSystem.readFileSync(fullPath, 'utf-8');
            console.log('FileService.getFiles - including file:', relativePath);
            files.push({ path: relativePath, content });
          } catch (error) {
            console.error(`Error reading file ${fullPath}: ${error}`);
          }
        } else {
          console.log('FileService.getFiles - excluding file:', relativePath);
        }
      }
    };

    walkDir(workspaceRoot);
    console.log('FileService.getFiles - final files:', files.map(f => f.path));
    return files;
  }

  private buildPatterns(config: Config) {
    console.log('FileService.buildPatterns - Config:', {
      includeGlobalExtensions: config.includeGlobalExtensions, 
      projectTypes: config.projectTypes
    });
    
    // Get all allowed extensions based on config
    const extensions = config.includeGlobalExtensions
      ? [...config.globalExtensions]
      : [];
      
    // Add project-specific extensions
    config.projectTypes.forEach(pt => {
      const projectExtensions = config.customExtensions[pt] || [];
      console.log(`FileService.buildPatterns - Adding extensions for project type ${pt}:`, projectExtensions);
      extensions.push(...projectExtensions);
    });
    
    // Get all blacklisted patterns from global blacklist
    const blacklist = [...config.globalBlacklist];
    
    // Add project-specific blacklists
    config.projectTypes.forEach(pt => {
      const projectBlacklist = config.customBlacklist[pt] || [];
      console.log(`FileService.buildPatterns - Adding blacklist for project type ${pt}:`, projectBlacklist);
      blacklist.push(...projectBlacklist);
    });

    // Always exclude node_modules and .git when using gitignore filter
    if (config.filterUsingGitignore) {
      blacklist.push('node_modules', '.git');
    }

    console.log('FileService.buildPatterns - final patterns:', { 
      extensions: extensions.length, 
      blacklist: blacklist.length 
    });
    
    return { extensions, blacklist };
  }
}