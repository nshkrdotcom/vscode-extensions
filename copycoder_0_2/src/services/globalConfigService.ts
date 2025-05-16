import * as vscode from 'vscode';
import { FileSystem } from './fileSystem';
import { Config, DEFAULT_CONFIG } from '../models/config';
import * as path from 'path';

export class GlobalConfigService {
  private config: Config;
  private readonly configPath: string;
  private readonly configDir: string;
  private _onConfigChange: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onConfigChange: vscode.Event<void> = this._onConfigChange.event;

  constructor(private readonly fileSystem: FileSystem) {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      this.configDir = path.join(workspacePath, '.vscode');
      this.configPath = path.join(this.configDir, 'copycoder.json');
    } else {
      this.configDir = '';
      this.configPath = '';
    }
    
    console.log('Debug: ConfigPath set to', this.configPath);
    
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
    console.log('Debug: getConfig returning', JSON.stringify(this.config));
    return this.deepCopy(this.config);
  }

  async updateConfig(updates: Partial<Config>): Promise<void> {
    try {
      // Deep merge the updates with the current config
      this.config = this.mergeConfigs(this.config, updates);
      await this.saveConfig();
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

  async resetConfig(): Promise<void> {
    try {
      // First delete the existing config file
      await this.deleteConfig();
      // Reset the config to default values
      this.config = this.deepCopy(DEFAULT_CONFIG);
      // Save the new config
      await this.saveConfig();
      // Fire the config change event
      this._onConfigChange.fire();
    } catch (error) {
      console.error('Error resetting config:', error);
      throw error;
    }
  }

  async deleteConfig(): Promise<void> {
    try {
      if (this.fileSystem.existsSync(this.configPath)) {
        await this.fileSystem.unlinkSync(this.configPath);
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      throw error;
    }
  }

  async saveConfig(): Promise<void> {
    try {
      if (!this.configPath) {
        console.log('Debug: No workspace folders, cannot save config');
        return;
      }

      // Ensure the .vscode directory exists
      if (!this.fileSystem.existsSync(this.configDir)) {
        console.log('Debug: Creating .vscode directory at', this.configDir);
        this.fileSystem.mkdirSync(this.configDir, { recursive: true });
      }

      console.log('Debug: Saving config to', this.configPath);
      await this.fileSystem.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('Debug: Config saved successfully');
      this._onConfigChange.fire();
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  private loadConfig(): void {
    if (!this.configPath) {
      console.log('Debug: No workspace folders, using default config');
      return;
    }
    
    if (this.fileSystem.existsSync(this.configPath)) {
      try {
        console.log('Debug: Reading config from', this.configPath);
        const data = this.fileSystem.readFileSync(this.configPath, 'utf-8');
        const savedConfig = JSON.parse(data);
        
        // Ensure we have a clean copy of DEFAULT_CONFIG before merging
        const defaultConfig = this.deepCopy(DEFAULT_CONFIG);
        
        // Deep merge with defaults
        this.config = {
          ...defaultConfig,
          ...this.deepCopy(savedConfig)
        };
        console.log('Debug: Successfully loaded config from file');
      } catch (error) {
        console.error('Error reading config:', error);
        // On error, use a fresh default config
        this.config = this.deepCopy(DEFAULT_CONFIG);
        console.log('Debug: Using default config due to error reading file');
      }
    } else {
      console.log('Debug: Config file does not exist, creating it');
      // Create the config file with default settings
      try {
        this.saveConfig();
      } catch (error) {
        console.error('Error creating initial config file:', error);
      }
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