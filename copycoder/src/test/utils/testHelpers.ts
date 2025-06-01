import { FileMetadata } from '../../models/fileMetadata';
import { Config } from '../../models/config';

/**
 * Test utilities for creating mock data
 */

export function createFileMetadata(
  relativePath: string,
  options: Partial<{
    absolutePath: string;
    isDirectory: boolean;
    size: number;
    lastModified: Date;
  }> = {}
): FileMetadata {
  return {
    relativePath,
    absolutePath: options.absolutePath || `/workspace/${relativePath}`,
    isDirectory: options.isDirectory || false,
    size: options.size || 1024,
    lastModified: options.lastModified || new Date('2024-01-01'),
  };
}

export function createTestConfig(overrides: Partial<Config> = {}): Config {
  return {
    includeGlobalExtensions: true,
    filterUsingGitignore: false,
    projectTypes: ['node'],
    globalExtensions: ['.js', '.ts', '.md'],
    customExtensions: { node: ['.js', '.ts'] },
    globalBlacklist: ['node_modules', '.git'],
    customBlacklist: { node: ['dist', 'build'] },
    ...overrides,
  };
}

export function createTestFiles(): FileMetadata[] {
  return [
    createFileMetadata('src/index.js'),
    createFileMetadata('src/utils.ts'),
    createFileMetadata('README.md'),
    createFileMetadata('package.json'),
    createFileMetadata('node_modules/lib.js'),
    createFileMetadata('dist/bundle.js'),
    createFileMetadata('.git/config'),
    createFileMetadata('src/test.exe'),
  ];
}

export function createMockFileMetadata(relativePath: string, options: Partial<{
  absolutePath: string;
  isDirectory: boolean;
  size: number;
  lastModified: Date;
}> = {}): FileMetadata {
  return createFileMetadata(relativePath, options);
}

export function createMockConfig(overrides: Partial<{
  globalBlacklist?: string[];
  projectSpecificBlacklist?: string[];
  globalExtensions?: string[];
  projectSpecificExtensions?: string[];
  includeGlobalExtensions?: boolean;
  filterUsingGitignore?: boolean;
  projectTypes?: string[];
  customExtensions?: Record<string, string[]>;
  customBlacklist?: Record<string, string[]>;
}> = {}): any {
  return {
    includeGlobalExtensions: true,
    filterUsingGitignore: false,
    projectTypes: ['node'],
    globalExtensions: ['.js', '.ts', '.md'],
    customExtensions: { node: ['.js', '.ts'] },
    globalBlacklist: ['node_modules', '.git'],
    customBlacklist: { node: ['dist', 'build'] },
    ...overrides,
  };
}
