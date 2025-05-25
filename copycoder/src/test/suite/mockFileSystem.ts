import * as path from 'path';
import { FileSystem } from '../../services/fileSystem';

export class MockFileSystem implements FileSystem {
  private files: { [path: string]: string } = {};
  private directories: { [path: string]: string[] } = {};
  private gitTrackedFiles: string[] = []; // For mocking git ls-files

  reset(): void {
    this.files = {};
    this.directories = {};
  }

  existsSync(filePath: string): boolean {
    return filePath in this.files || filePath in this.directories;
  }

  readFileSync(filePath: string, _encoding: string): string {
    if (!(filePath in this.files)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return this.files[filePath];
  }

  writeFileSync(filePath: string, data: string, _encoding: string): void {
    const dir = path.dirname(filePath);
    console.log('MockFileSystem.writeFileSync - filePath:', filePath, 'dir:', dir);
    this.mkdirSync(dir, { recursive: true });
    const baseName = path.basename(filePath);
    if (!this.directories[dir].includes(baseName)) {
      this.directories[dir].push(baseName);
    }
    this.files[filePath] = data;
    console.log(`MockFileSystem.writeFileSync: Wrote ${filePath}, directories[${dir}] = ${JSON.stringify(this.directories[dir])}`);
  }

  readdirSync(dirPath: string): string[] {
    const entries = this.directories[dirPath] || [];
    console.log(`MockFileSystem.readdirSync: dirPath=${dirPath}, entries=${JSON.stringify(entries)}, directories=${JSON.stringify(this.directories)}`);
    return [...entries];
  }

  mkdirSync(dirPath: string, options: { recursive: boolean }): void {
    if (!(dirPath in this.directories)) {
      this.directories[dirPath] = [];
      if (options.recursive && dirPath !== '/' && dirPath !== '.') {
        const parent = path.dirname(dirPath);
        this.mkdirSync(parent, { recursive: true });
        const baseName = path.basename(dirPath);
        if (!this.directories[parent].includes(baseName)) {
          this.directories[parent].push(baseName);
        }
      }
      console.log(`MockFileSystem: Created directory ${dirPath}, directories = ${JSON.stringify(this.directories)}`);
    }
  }

  unlinkSync(filePath: string): void {
    if (filePath in this.files) {
      const dir = path.dirname(filePath);
      if (dir in this.directories) {
        this.directories[dir] = this.directories[dir].filter(f => f !== path.basename(filePath));
      }
      delete this.files[filePath];
    }
  }

  isDirectory(path: string): boolean {
    const isDir = path in this.directories && !(path in this.files);
    console.log(`MockFileSystem: isDirectory(${path}) = ${isDir}`);
    return isDir;
  }

  execSync(command: string, options?: { cwd?: string; encoding?: string }): string {
    console.log(`MockFileSystem: execSync(${command}) with options:`, options);
    
    // Mock git ls-files command
    if (command.includes('git ls-files')) {
      return this.gitTrackedFiles.join('\n');
    }
    
    // Mock git status --porcelain to check if it's a git repo
    if (command.includes('git status --porcelain')) {
      // Return empty string to indicate it's a valid git repo
      return '';
    }
    
    // For other commands, return empty string
    return '';
  }

  // Helper method for tests to set up git tracked files
  setGitTrackedFiles(files: string[]): void {
    this.gitTrackedFiles = files;
  }
}