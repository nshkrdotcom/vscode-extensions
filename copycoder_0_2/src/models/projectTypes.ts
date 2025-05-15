
// src/models/projectTypes.ts
export const DEFAULT_EXTENSIONS: { [key: string]: string[] } = {
    // Global extensions that can be included with any project type
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

export const DEFAULT_BLACKLIST: { [key: string]: string[] } = {
    // Global blacklist applied to all project types
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
        '*.psd1',  // Module manifest files
        '*.psm1'   // Module files
    ]
};