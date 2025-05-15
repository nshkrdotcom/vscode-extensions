// src/services/globalConfigService.ts
import * as path from 'path';
import * as os from 'os';
import { Config } from '../models';
import { FileSystem } from './fileSystem';
import { DEFAULT_EXTENSIONS, DEFAULT_BLACKLIST } from '../models/projectTypes';

export class GlobalConfigService {
  private static readonly CONFIG_DIR = path.join(os.homedir(), '.copycoder');
  private static readonly CONFIG_PATH = path.join(
    GlobalConfigService.CONFIG_DIR,
    'config.json'
  );
  private static readonly DEFAULT_CONFIG: Config = {
    includeGlobalExtensions: true,
    applyGlobalBlacklist: true,
    filterUsingGitignore: true, // New field
    projectExtensions: Object.fromEntries(
      Object.entries(DEFAULT_EXTENSIONS).filter(([key]) => key !== 'global')
    ),
    globalExtensions: DEFAULT_EXTENSIONS.global || [],
    projectBlacklist: Object.fromEntries(
      Object.entries(DEFAULT_BLACKLIST).filter(([key]) => key !== 'global')
    ),
    globalBlacklist: DEFAULT_BLACKLIST.global || [],
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
      const savedConfig = JSON.parse(content);
      // Deep merge to preserve nested structures
      const mergedConfig: Config = {
        ...GlobalConfigService.DEFAULT_CONFIG,
        ...savedConfig,
        projectExtensions: {
          ...GlobalConfigService.DEFAULT_CONFIG.projectExtensions,
          ...savedConfig.projectExtensions,
        },
        projectBlacklist: {
          ...GlobalConfigService.DEFAULT_CONFIG.projectBlacklist,
          ...savedConfig.projectBlacklist,
        },
      };
      return mergedConfig;
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