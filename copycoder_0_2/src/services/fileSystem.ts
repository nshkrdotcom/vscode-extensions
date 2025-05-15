// src/services/fileSystem.ts
import * as fs from 'fs';
import * as path from 'path';

export interface FileSystem {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive: boolean }): void;
  readFileSync(path: string, encoding: string): string;
  writeFileSync(path: string, data: string, encoding: string): void;
}

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
}