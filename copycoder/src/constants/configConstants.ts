/**
 * Central configuration constants for CopyCoder extension
 * 
 * This file serves as the single source of truth for all configuration constants
 * used throughout the application and tests.
 */

/**
 * Project type definitions
 */
export const PROJECT_TYPES = Object.freeze([
  'powershell',
  'terraform',
  'bash',
  'php',
  'mysql',
  'postgres',
  'elixir',
  'python',
  'node',
  'vscode',
  'wsl2'
]);

/**
 * File extensions to include for each project type
 */
export const EXTENSIONS_MAP = Object.freeze({
  'global': ['.md', '.txt', '.gitignore', '.env.example', '.editorconfig'],
  'powershell': ['.ps1', '.psm1', '.psd1'],
  'terraform': ['.tf', '.tfvars'],
  'bash': ['.sh', '.bash', '.zsh'],
  'php': ['.php', '.phtml', '.php3', '.php4', '.php5', '.php7', '.php8'],
  'mysql': ['.sql', '.mysql'],
  'postgres': ['.sql', '.pgsql'],
  'elixir': ['.ex', '.exs'],
  'python': ['.py', '.pyw', '.pyi'],
  'node': ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.node'],
  'vscode': ['.json', '.yml', '.yaml'],
  'wsl2': ['.sh', '.bash', '.zsh', '.ps1']
});

/**
 * Blacklist patterns for each project type
 */
export const BLACKLIST_MAP = Object.freeze({
  'global': [
    '*.min.js',
    '*.min.css',
    '.DS_Store',
    'Thumbs.db',
    '.vscode/*',
    '.idea/*',
    '.vs/*'
  ],
  'node': [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.npmrc',
    '.yarnrc',
    '.pnpmrc',
    'node_modules/*'
  ],
  'python': [
    'Pipfile.lock',
    'poetry.lock',
    '__pycache__',
    '*.pyc',
    '.pytest_cache',
    'venv/*',
    '.venv/*'
  ],
  'terraform': [
    '.terraform.lock.hcl',
    'terraform.tfstate',
    'terraform.tfstate.backup',
    '.terraform/*'
  ],
  'vscode': [
    '*.vsix',
    '.vscodeignore'
  ],
  'powershell': [
    '*.psd1',
    '*.psm1'
  ]
});

/**
 * Default configuration for tests
 */
export const TEST_DEFAULT_CONFIG = Object.freeze({
  includeGlobalExtensions: true,
  filterUsingGitignore: false,
  projectTypes: [],
  globalExtensions: ['.md'],
  customExtensions: {},
  globalBlacklist: [],
  customBlacklist: {}
});

/**
 * Helper function to generate rich default config
 */
export function createRichDefaultConfig() {
  return {
    includeGlobalExtensions: true,
    filterUsingGitignore: false,
    projectTypes: [...PROJECT_TYPES],
    globalExtensions: [...EXTENSIONS_MAP.global],
    customExtensions: PROJECT_TYPES.reduce((acc, type) => {
      acc[type] = [...(EXTENSIONS_MAP[type as keyof typeof EXTENSIONS_MAP] || [])];
      return acc;
    }, {} as { [projectType: string]: string[] }),
    globalBlacklist: [...BLACKLIST_MAP.global],
    customBlacklist: PROJECT_TYPES.reduce((acc, type) => {
      acc[type] = [...(BLACKLIST_MAP[type as keyof typeof BLACKLIST_MAP] || [])];
      return acc;
    }, {} as { [projectType: string]: string[] })
  };
} 