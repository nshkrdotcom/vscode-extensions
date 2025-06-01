import { FileMetadata, FilterContext } from '../models/fileMetadata';
import { Config } from '../models/config';

/**
 * Interface for file system scanning strategies
 */
export interface FileSystemScanner {
  scanFiles(workspaceRoot: string): Promise<FileMetadata[]>;
}

/**
 * Interface for file filtering strategies
 */
export interface FileFilter {
  filter(files: FileMetadata[], config: Config, context: FilterContext): Promise<FileMetadata[]>;
}

/**
 * Interface for git operations
 */
export interface GitService {
  getTrackedFiles(workspaceRoot: string): Promise<string[]>;
  isGitRepository(workspaceRoot: string): Promise<boolean>;
}
