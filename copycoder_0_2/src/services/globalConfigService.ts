import * as path from 'path';
import { FileSystem } from './fileSystem';
import { Config, DEFAULT_CONFIG } from '../models/config';

export class GlobalConfigService {
  private readonly configPath: string;

  constructor(private readonly fileSystem: FileSystem) {
    this.configPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.copycoder', 'config.json');
  }

  getConfig(): Config {
    try {
      if (!this.fileSystem.existsSync(this.configPath)) {
        this.saveConfig(DEFAULT_CONFIG); // This might throw an error if directory can't be created
        return DEFAULT_CONFIG;
      }
      const rawConfig = this.fileSystem.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(rawConfig) as Config;
      return this.mergeConfig(DEFAULT_CONFIG, config);
    } catch (error) {
      console.error(`Failed to load config from ${this.configPath}: ${error}`);
      return { ...DEFAULT_CONFIG }; // Return a copy of DEFAULT_CONFIG instead of trying to save
    }
  }

  saveConfig(config: Config): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!this.fileSystem.existsSync(configDir)) {
        this.fileSystem.mkdirSync(configDir, { recursive: true });
      }
      this.fileSystem.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save config to ${this.configPath}: ${error}`);
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  private mergeConfig(defaultConfig: Config, userConfig: Partial<Config>): Config {
    return {
      includeGlobalExtensions: userConfig.includeGlobalExtensions ?? defaultConfig.includeGlobalExtensions,
      filterUsingGitignore: userConfig.filterUsingGitignore ?? defaultConfig.filterUsingGitignore,
      projectTypes: userConfig.projectTypes ?? defaultConfig.projectTypes,
      globalExtensions: userConfig.globalExtensions ?? defaultConfig.globalExtensions,
      customExtensions: userConfig.customExtensions ?? defaultConfig.customExtensions,
      globalBlacklist: userConfig.globalBlacklist ?? defaultConfig.globalBlacklist,
      customBlacklist: userConfig.customBlacklist ?? defaultConfig.customBlacklist
    };
  }
}