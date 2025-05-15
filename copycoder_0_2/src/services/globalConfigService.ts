// src/services/globalConfigService.ts
import * as path from 'path';
import * as os from 'os';
import { Config } from '../models';
import { FileSystem } from './fileSystem';

export class GlobalConfigService {
  private static readonly CONFIG_DIR = path.join(os.homedir(), '.copycoder');
  private static readonly CONFIG_PATH = path.join(
    GlobalConfigService.CONFIG_DIR,
    'config.json'
  );
  private static readonly DEFAULT_CONFIG: Config = {
    includeGlobalExtensions: true,
    applyGlobalBlacklist: true,
    extensions: ['.js', '.ts', '.md'],
    blacklist: ['node_modules', 'dist'],
  };

  constructor(private fs: FileSystem) {}

  public getConfig(): Config {
    try {
      if (!this.fs.existsSync(GlobalConfigService.CONFIG_DIR)) {
        this.fs.mkdirSync(GlobalConfigService.CONFIG_DIR, { recursive: true });
      }
      if (!this.fs.existsSync(GlobalConfigService.CONFIG_PATH)) {
        this.saveConfig(GlobalConfigService.DEFAULT_CONFIG);
        return GlobalConfigService.DEFAULT_CONFIG;
      }
      const content = this.fs.readFileSync(GlobalConfigService.CONFIG_PATH, 'utf8');
      const config = JSON.parse(content);
      return { ...GlobalConfigService.DEFAULT_CONFIG, ...config };
    } catch (error) {
      console.error('Error reading config:', error);
      return GlobalConfigService.DEFAULT_CONFIG;
    }
  }

  public saveConfig(config: Config): void {
    try {
      if (!this.fs.existsSync(GlobalConfigService.CONFIG_DIR)) {
        this.fs.mkdirSync(GlobalConfigService.CONFIG_DIR, { recursive: true });
      }
      this.fs.writeFileSync(
        GlobalConfigService.CONFIG_PATH,
        JSON.stringify(config, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }
}