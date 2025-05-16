export interface Config {
  includeGlobalExtensions: boolean;
  filterUsingGitignore: boolean;
  projectTypes: string[];
  globalExtensions: string[];
  customExtensions: { [projectType: string]: string[] };
  globalBlacklist: string[];
  customBlacklist: { [projectType: string]: string[] };
}

const DEFAULT_EXTENSIONS: { [key: string]: string[] } = {
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
};

const DEFAULT_BLACKLIST: { [key: string]: string[] } = {
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
};

const projectTypes = Object.keys(DEFAULT_EXTENSIONS).filter(type => type !== 'global');
const customExtensions: { [projectType: string]: string[] } = {};
const customBlacklist: { [projectType: string]: string[] } = {};

projectTypes.forEach(type => {
  customExtensions[type] = DEFAULT_EXTENSIONS[type];
  customBlacklist[type] = DEFAULT_BLACKLIST[type] || [];
});

export const DEFAULT_CONFIG: Config = {
  includeGlobalExtensions: true,
  filterUsingGitignore: true,
  projectTypes: projectTypes,
  globalExtensions: DEFAULT_EXTENSIONS['global'],
  customExtensions: customExtensions,
  globalBlacklist: DEFAULT_BLACKLIST['global'],
  customBlacklist: customBlacklist
};