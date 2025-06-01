/**
 * Core interfaces for the new file copying architecture
 */

export interface FileMetadata {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly isDirectory: boolean;
  readonly size: number;
  readonly lastModified: Date;
}

export interface FilterContext {
  workspaceRoot: string;
  config: any;
  gitTrackedFiles?: Set<string>;
}

export interface CommandExecutor {
  execute(command: string, options: { cwd: string }): Promise<string>;
}

export interface FileFilter {
  filter(file: FileMetadata, context: FilterContext): boolean;
}

export interface FileContent {
  path: string;
  content: string;
}
