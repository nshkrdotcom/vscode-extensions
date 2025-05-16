// src/models/config.ts
export interface Config {
  includeGlobalExtensions: boolean;
  applyGlobalBlacklist: boolean;
  filterUsingGitignore: boolean;
  projectExtensions: { [key: string]: string[] };
  globalExtensions: string[];
  projectBlacklist: { [key: string]: string[] };
  globalBlacklist: string[];
  enabledProjectTypes: string[];
  customExtensions: string[];
  customBlacklist: string[];
}
