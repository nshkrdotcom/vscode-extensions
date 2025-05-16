import * as fs from 'fs';
import { FileSystem } from './fileSystem';

export class NodeFileSystem implements FileSystem {
  existsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  mkdirSync(path: string, options?: { recursive: boolean }): void {
    fs.mkdirSync(path, options);
  }

  readFileSync(path: string, encoding: string): string {
    return fs.readFileSync(path, { encoding: encoding as BufferEncoding }).toString();
  }

  writeFileSync(path: string, data: string, encoding: string): void {
    fs.writeFileSync(path, data, { encoding: encoding as BufferEncoding });
  }

  unlinkSync(path: string): void {
    fs.unlinkSync(path);
  }

  readdirSync(path: string): string[] {
    return fs.readdirSync(path);
  }

  isDirectory(path: string): boolean {
    try {
      return fs.statSync(path).isDirectory();
    } catch (error) {
      return false; // Return false if the path doesn't exist or is inaccessible
    }
  }
}