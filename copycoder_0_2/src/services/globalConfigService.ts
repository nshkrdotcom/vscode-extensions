import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { FileSystem } from './fileSystem';
import { Config, DEFAULT_CONFIG, RICH_DEFAULT_CONFIG } from '../models/config';

export class GlobalConfigService {
  private config: Config;
  private readonly configPath: string;
  private readonly configDir: string;
  private _onConfigChange: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onConfigChange: vscode.Event<void> = this._onConfigChange.event;

  constructor(private readonly fileSystem: FileSystem) {
    // Use the home directory based configuration
    this.configDir = path.join(os.homedir(), '.copycoder');
    this.configPath = path.join(this.configDir, 'config.json');
    
    console.log('Debug: ConfigPath set to', this.configPath);
    
    // Initialize with empty default config (used by tests)
    this.config = this.deepCopy(DEFAULT_CONFIG);
    console.log('Debug: Initial DEFAULT_CONFIG', JSON.stringify(DEFAULT_CONFIG));
    
    this.loadConfig();
    console.log('Debug: Config after loading', JSON.stringify(this.config));
    
    // Log tree-related fields specifically
    console.log('Debug: projectTypes', this.config.projectTypes);
    console.log('Debug: globalExtensions', this.config.globalExtensions);
    console.log('Debug: customExtensions', JSON.stringify(this.config.customExtensions));
  }

  getConfig(): Config {
    if (!this.fileSystem.existsSync(this.configPath)) {
      console.log('Debug: Config file does not exist, returning DEFAULT_CONFIG');
      return this.deepCopy(DEFAULT_CONFIG);
    }
    console.log('Debug: getConfig returning config with projectTypes', this.config.projectTypes);
    return this.deepCopy(this.config);
  }

  async updateConfig(updates: Partial<Config>): Promise<void> {
    try {
      console.log('Debug: Updating config with', JSON.stringify(updates));
      
      // Deep merge the updates with the current config
      this.config = this.mergeConfigs(this.config, updates);
      
      console.log('Debug: Config after merge', JSON.stringify(this.config));
      
      this.saveConfig();
      
      console.log('Debug: Config saved successfully');
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }

  private mergeConfigs(current: Config, updates: Partial<Config>): Config {
    const merged = this.deepCopy(current);
    
    // Handle primitive values
    if (updates.includeGlobalExtensions !== undefined) {
      merged.includeGlobalExtensions = updates.includeGlobalExtensions;
    }
    if (updates.filterUsingGitignore !== undefined) {
      merged.filterUsingGitignore = updates.filterUsingGitignore;
    }

    // Handle arrays
    if (Array.isArray(updates.projectTypes)) {
      merged.projectTypes = [...updates.projectTypes];
    }
    if (Array.isArray(updates.globalExtensions)) {
      merged.globalExtensions = [...updates.globalExtensions];
    }
    if (Array.isArray(updates.globalBlacklist)) {
      merged.globalBlacklist = [...updates.globalBlacklist];
    }

    // Handle objects
    if (updates.customExtensions) {
      merged.customExtensions = this.deepCopy(updates.customExtensions);
    }
    if (updates.customBlacklist) {
      merged.customBlacklist = this.deepCopy(updates.customBlacklist);
    }

    return merged;
  }

  resetConfig(): void {
    try {
      console.log('Debug: Resetting config to defaults');
      
      // First delete the existing config file
      this.deleteConfig();
      
      // Reset the config to default values - use DEFAULT_CONFIG for tests
      this.config = this.deepCopy(DEFAULT_CONFIG);
      
      // Save the new config
      this.saveConfig();
      
      // Fire the config change event
      this._onConfigChange.fire();
      
      console.log('Debug: Config reset complete');
    } catch (error) {
      console.error('Error resetting config:', error);
      throw error;
    }
  }

  deleteConfig(): void {
    try {
      if (this.fileSystem.existsSync(this.configPath)) {
        console.log('Debug: Deleting config file at', this.configPath);
        this.fileSystem.unlinkSync(this.configPath);
        console.log('Debug: Config file deleted');
      } else {
        console.log('Debug: Config file does not exist, nothing to delete');
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      throw error;
    }
  }

  saveConfig(): void {
    try {
      // Ensure the config directory exists
      if (!this.fileSystem.existsSync(this.configDir)) {
        console.log('Debug: Creating config directory at', this.configDir);
        this.fileSystem.mkdirSync(this.configDir, { recursive: true });
      }

      console.log('Debug: Saving config to', this.configPath);
      console.log('Debug: Config content to save:', JSON.stringify(this.config, null, 2));
      
      this.fileSystem.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      
      console.log('Debug: Config saved successfully');
      this._onConfigChange.fire();
    } catch (error) {
      console.error('Error saving config:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private loadConfig(): void {
    try {
      if (this.fileSystem.existsSync(this.configPath)) {
        console.log('Debug: Reading config from', this.configPath);
        const data = this.fileSystem.readFileSync(this.configPath, 'utf-8');
        console.log('Debug: Raw config data read:', data);
        
        const savedConfig = JSON.parse(data);
        console.log('Debug: Parsed config:', JSON.stringify(savedConfig));
        
        // Ensure we have a clean copy of DEFAULT_CONFIG before merging
        const defaultConfig = this.deepCopy(DEFAULT_CONFIG);
        
        // Deep merge with defaults
        this.config = {
          ...defaultConfig,
          ...this.deepCopy(savedConfig)
        };
        console.log('Debug: Successfully loaded config from file');
        console.log('Debug: Loaded config projectTypes:', this.config.projectTypes);
      } else {
        console.log('Debug: Config file does not exist at', this.configPath);
        console.log('Debug: Creating new config file with rich defaults');
        
        // Initialize with rich defaults for a new config file
        this.config = this.deepCopy(RICH_DEFAULT_CONFIG);
        
        try {
          this.saveConfig();
        } catch (saveError) {
          console.error('Error creating initial config file:', saveError);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // On error, use a fresh default config
      this.config = this.deepCopy(DEFAULT_CONFIG);
      console.log('Debug: Using default config due to error loading file');
    }
  }

  private deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item)) as any;
    }
    const copy = {} as T;
    Object.keys(obj).forEach(key => {
      copy[key as keyof T] = this.deepCopy(obj[key as keyof T]);
    });
    return copy;
  }
}