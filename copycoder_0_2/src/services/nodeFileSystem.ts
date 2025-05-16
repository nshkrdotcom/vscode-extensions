import * as fs from 'fs';
import * as path from 'path';

// Import the FileSystem interface from the correct file
import { FileSystem } from './fileSystem';

export class NodeFileSystem implements FileSystem {
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.env.HOME || '', '.copycoder', 'config.json');
  }

  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  readFileSync(filePath: string, encoding: string): string {
    return fs.readFileSync(filePath, encoding as BufferEncoding).toString();
  }

  writeFileSync(filePath: string, data: string, encoding: string): void {
    fs.writeFileSync(filePath, data, encoding as BufferEncoding);
  }

  mkdirSync(dirPath: string, options: { recursive: boolean }): void {
    fs.mkdirSync(dirPath, options);
  }
}