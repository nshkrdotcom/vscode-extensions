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
      return [];
    }

    const files: FileContent[] = [];
    const patterns = this.buildPatterns(config);

    const includePattern = patterns.extensions.map(ext => `**/*${ext}`).join('|');
    const excludePattern = patterns.blacklist.map(item => `**/${item}/**`).join('|');

    try {
      const uris = await vscode.workspace.findFiles(includePattern, excludePattern);
      for (const uri of uris) {
        const relativePath = vscode.workspace.asRelativePath(uri, false);
        const content = this.fileSystem.readFileSync(uri.fsPath, 'utf-8');
        files.push({ path: relativePath, content });
      }
    } catch (error) {
      throw new Error(`Failed to scan files: ${error}`);
    }

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
    if (!this.fileSystem.existsSync(gitignorePath)) {
      return [];
    }
    try {
      const content = this.fileSystem.readFileSync(gitignorePath, 'utf-8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.replace(/\/$/, '').replace(/\\/g, '/'));
    } catch (error) {
      console.error(`Error reading .gitignore: ${error}`);
      return [];
    }
  }


  getFiles(workspaceRoot: string, config: Config): FileContent[] {
    const files: FileContent[] = [];
    const allowedExtensions = this.getAllowedExtensions(config);
    const blacklistedFiles = this.getBlacklistedFiles(config);
    const gitignorePatterns = this.parseGitignore(workspaceRoot);
    console.log('FileService.getFiles - workspaceRoot:', workspaceRoot);
    console.log('FileService.getFiles - allowedExtensions:', [...allowedExtensions]);
    console.log('FileService.getFiles - blacklistedFiles:', [...blacklistedFiles]);
    console.log('FileService.getFiles - gitignorePatterns:', gitignorePatterns);

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
        if (blacklistedFiles.has(entry) || blacklistedFiles.has(relativePath) || relativePath.includes('node_modules') || relativePath.includes('.git')) {
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
    const extensions = config.includeGlobalExtensions
      ? [...config.globalExtensions]
      : [];
    config.projectTypes.forEach(pt => {
      extensions.push(...(config.customExtensions[pt] || []));
    });

    const blacklist = [...config.globalBlacklist];
    config.projectTypes.forEach(pt => {
      blacklist.push(...(config.customBlacklist[pt] || []));
    });

    if (config.filterUsingGitignore) {
      blacklist.push('node_modules', '.git');
    }

    return { extensions, blacklist };
  }
}