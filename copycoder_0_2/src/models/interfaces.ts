// src/models/interfaces.ts
export interface CopyCodeConfig {
    // Whether global extensions are automatically included
    includeGlobalExtensions: boolean;
    // Whether global blacklist is automatically applied
    applyGlobalBlacklist: boolean;
    // Enabled project types
    enabledProjectTypes: string[];
    // Custom extensions to include
    customExtensions: string[];
    // Custom blacklist patterns
    customBlacklist: string[];
}

export interface CustomCopyCommand {
    name: string;
    script: string;
    description?: string;
}

export interface FileScanResult {
    files: { path: string; content: string }[];
    hasGitignore: boolean;
}

export interface ParsedCodeBlock {
    path: string;
    filename: string;
    extension: string;
    code: string;
}


export interface Config {
  includeGlobalExtensions: boolean;
  applyGlobalBlacklist: boolean;
  filterUsingGitignore: boolean; // New field
  projectExtensions: Record<string, string[]>;
  globalExtensions: string[];
  projectBlacklist: Record<string, string[]>;
  globalBlacklist: string[];
}