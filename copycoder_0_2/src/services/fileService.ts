import * as vscode from 'vscode';
import { FileSystem } from './fileSystem'; // Fixed import
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
    if (!allowedExtensions.has(ext)) {
      return false;
    }
    return ![...blacklistedFiles].some((pattern: string) => filePath.includes(pattern));
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