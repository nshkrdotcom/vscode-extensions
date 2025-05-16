// src/services/fileSystem.ts
export interface FileSystem {
  existsSync(path: string): boolean;
  readFileSync(path: string, encoding: string): string;
  writeFileSync(path: string, data: string, encoding: string): void;
  mkdirSync(path: string, options?: { recursive: boolean }): void;
  unlinkSync(path: string): void;
  readdirSync(path: string): string[];
  isDirectory(path: string): boolean; // Required method
}