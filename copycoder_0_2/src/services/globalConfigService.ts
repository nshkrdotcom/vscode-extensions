import * as vscode from 'vscode';
import { FileSystem } from './fileSystem';
import { Config, DEFAULT_CONFIG } from '../models/config';

export class GlobalConfigService {
  private config: Config;
  private readonly configPath: string;
  private _onConfigChange: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onConfigChange: vscode.Event<void> = this._onConfigChange.event;

  constructor(private readonly fileSystem: FileSystem) {
    this.configPath = vscode.workspace.workspaceFolders
      ? `${vscode.workspace.workspaceFolders[0].uri.fsPath}/.vscode/copycoder.json`
      : '';
    this.config = this.deepCopy(DEFAULT_CONFIG);
    this.loadConfig();
  }

  getConfig(): Config {
    if (!this.fileSystem.existsSync(this.configPath)) {
      return this.deepCopy(DEFAULT_CONFIG);
    }
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
      await this.fileSystem.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      this._onConfigChange.fire();
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  private loadConfig(): void {
    if (this.fileSystem.existsSync(this.configPath)) {
      try {
        const data = this.fileSystem.readFileSync(this.configPath, 'utf-8');
        const savedConfig = JSON.parse(data);
        
        // Ensure we have a clean copy of DEFAULT_CONFIG before merging
        const defaultConfig = this.deepCopy(DEFAULT_CONFIG);
        
        // Deep merge with defaults
        this.config = {
          ...defaultConfig,
          ...this.deepCopy(savedConfig)
        };
      } catch (error) {
        console.error('Error reading config:', error);
        // On error, use a fresh default config
        this.config = this.deepCopy(DEFAULT_CONFIG);
      }
    }
    // Otherwise keep the default config initialized in constructor
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