// src/services/globalConfigService.ts
import * as path from 'path';
import * as os from 'os';
import { FileSystem } from './fileSystem';
import { DEFAULT_EXTENSIONS, DEFAULT_BLACKLIST } from '../models/projectTypes';
import { Config } from '../models/config';

export class GlobalConfigService {
  private readonly configDir: string;
  private readonly configPath: string;
  private readonly DEFAULT_CONFIG: Config = {
    includeGlobalExtensions: true,
    applyGlobalBlacklist: true,
    filterUsingGitignore: true,
    projectExtensions: { ...DEFAULT_EXTENSIONS },
    globalExtensions: DEFAULT_EXTENSIONS['global'] || [],
    projectBlacklist: { ...DEFAULT_BLACKLIST },
    globalBlacklist: DEFAULT_BLACKLIST['global'] || [],
    enabledProjectTypes: [
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
      'wsl2',
    ],
    customExtensions: [],
    customBlacklist: [],
  };

  constructor(private fs: FileSystem) {
    this.configDir = path.join(os.homedir(), '.copycoder');
    this.configPath = path.join(this.configDir, 'config.json');
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target && !(source[key] instanceof Array)) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  public getConfig(): Config {
    try {
      if (!this.fs.existsSync(this.configDir)) {
        this.fs.mkdirSync(this.configDir, { recursive: true });
      }

      if (!this.fs.existsSync(this.configPath)) {
        this.fs.writeFileSync(
          this.configPath,
          JSON.stringify(this.DEFAULT_CONFIG, null, 2),
          'utf8',
        );
        return { ...this.DEFAULT_CONFIG };
      }

      const savedConfig = JSON.parse(
        this.fs.readFileSync(this.configPath, 'utf8'),
      );
      return this.deepMerge(this.DEFAULT_CONFIG, savedConfig);
    } catch (error) {
      console.error('Error reading config:', error);
      return { ...this.DEFAULT_CONFIG };
    }
  }

  public saveConfig(config: Config): void {
    try {
      if (!this.fs.existsSync(this.configDir)) {
        this.fs.mkdirSync(this.configDir, { recursive: true });
      }
      this.fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        'utf8',
      );
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }
}