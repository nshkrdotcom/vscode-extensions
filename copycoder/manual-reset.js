const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to the config file
const configDir = path.join(os.homedir(), '.copycoder');
const configPath = path.join(configDir, 'config.json');

console.log('Manually resetting config with rich defaults...');
console.log(`Config path: ${configPath}`);

// Back up the current config if it exists
if (fs.existsSync(configPath)) {
  const backupPath = path.join(configDir, 'config.json.backup');
  console.log(`Backing up existing config to: ${backupPath}`);
  fs.copyFileSync(configPath, backupPath);
}

// Define rich defaults
const projectTypes = [
  'powershell', 'terraform', 'bash', 'php', 'mysql', 
  'postgres', 'elixir', 'python', 'node', 'vscode', 'wsl2'
];

const globalExtensions = [
  '.md', '.txt', '.gitignore', '.env.example', '.editorconfig'
];

const extensions = {
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

const globalBlacklist = [
  '*.min.js', '*.min.css', '.DS_Store', 'Thumbs.db', 
  '.vscode/*', '.idea/*', '.vs/*'
];

const blacklist = {
  'powershell': ['*.psd1', '*.psm1'],
  'terraform': [
    '.terraform.lock.hcl', 'terraform.tfstate', 
    'terraform.tfstate.backup', '.terraform/*'
  ],
  'bash': [],
  'php': [],
  'mysql': [],
  'postgres': [],
  'elixir': [],
  'python': [
    'Pipfile.lock', 'poetry.lock', '__pycache__', 
    '*.pyc', '.pytest_cache', 'venv/*', '.venv/*'
  ],
  'node': [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.npmrc', '.yarnrc', '.pnpmrc', 'node_modules/*'
  ],
  'vscode': ['*.vsix', '.vscodeignore'],
  'wsl2': []
};

// Create the rich config object
const richConfig = {
  includeGlobalExtensions: true,
  filterUsingGitignore: false,
  projectTypes: projectTypes,
  globalExtensions: globalExtensions,
  customExtensions: extensions,
  globalBlacklist: globalBlacklist,
  customBlacklist: blacklist
};

// Make sure the directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Write the rich config
fs.writeFileSync(configPath, JSON.stringify(richConfig, null, 2), 'utf8');
console.log('Rich default config written successfully!');

// Read the new config and show key stats
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log('\nConfig now has:');
console.log('- Project types:', config.projectTypes.length, '(e.g.,', config.projectTypes.slice(0, 3).join(', '), '...)');
console.log('- Global extensions:', config.globalExtensions.length, '(', config.globalExtensions.join(', '), ')');
console.log('- Custom extensions for project types:', Object.keys(config.customExtensions).length);
console.log('- Node extensions:', config.customExtensions.node?.length || 0, '(e.g.,', 
  config.customExtensions.node?.slice(0, 3).join(', ') || 'none', '...)');

console.log('\nReset complete!'); 