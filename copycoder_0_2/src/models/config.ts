import { 
  EXTENSIONS_MAP,
  BLACKLIST_MAP,
  TEST_DEFAULT_CONFIG,
  createRichDefaultConfig
} from '../constants/configConstants';

export interface Config {
  includeGlobalExtensions: boolean;
  filterUsingGitignore: boolean;
  projectTypes: string[];
  globalExtensions: string[];
  customExtensions: { [projectType: string]: string[] };
  globalBlacklist: string[];
  customBlacklist: { [projectType: string]: string[] };
}

// Export constants from the centralized config file
export const AVAILABLE_EXTENSIONS = EXTENSIONS_MAP;
export const AVAILABLE_BLACKLIST = BLACKLIST_MAP;

// Default configuration that matches test expectations
export const DEFAULT_CONFIG: Config = TEST_DEFAULT_CONFIG;

// Rich default config with all project types
export const RICH_DEFAULT_CONFIG: Config = createRichDefaultConfig();

console.log('DEFAULT_CONFIG initialized with projectTypes:', DEFAULT_CONFIG.projectTypes);