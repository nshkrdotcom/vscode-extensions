export interface Config {
  includeGlobalExtensions: boolean;
  filterUsingGitignore: boolean;
  projectTypes: string[];
  globalExtensions: string[];
  customExtensions: { [projectType: string]: string[] };
  globalBlacklist: string[];
  customBlacklist: { [projectType: string]: string[] };
}

// Store default extensions for reference
export const AVAILABLE_EXTENSIONS: { [key: string]: string[] } = Object.freeze({
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

// Store default blacklist for reference
export const AVAILABLE_BLACKLIST: { [key: string]: string[] } = Object.freeze({
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

// Get project types (all keys except 'global')
const projectTypes = Object.keys(AVAILABLE_EXTENSIONS).filter(type => type !== 'global');

// Initialize custom extensions and blacklists for rich defaults
// These will be used when initializing the extension with a new configuration file
export const RICH_DEFAULT_CONFIG: Config = {
  includeGlobalExtensions: true,
  filterUsingGitignore: false,
  projectTypes: [...projectTypes],
  globalExtensions: [...AVAILABLE_EXTENSIONS.global],
  customExtensions: projectTypes.reduce((acc, type) => {
    acc[type] = [...(AVAILABLE_EXTENSIONS[type] || [])];
    return acc;
  }, {} as { [projectType: string]: string[] }),
  globalBlacklist: [...AVAILABLE_BLACKLIST.global],
  customBlacklist: projectTypes.reduce((acc, type) => {
    acc[type] = [...(AVAILABLE_BLACKLIST[type] || [])];
    return acc;
  }, {} as { [projectType: string]: string[] })
};

// Default configuration that matches test expectations
export const DEFAULT_CONFIG: Config = {
  includeGlobalExtensions: true,
  filterUsingGitignore: false,
  projectTypes: [],
  globalExtensions: ['.md'],
  customExtensions: {},
  globalBlacklist: [],
  customBlacklist: {}
};

console.log('DEFAULT_CONFIG initialized with projectTypes:', DEFAULT_CONFIG.projectTypes);