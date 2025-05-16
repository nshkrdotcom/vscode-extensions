// src/services/configService.ts
import * as vscode from 'vscode';
import { Config, DEFAULT_CONFIG } from '../models/config';

export class ConfigService {
  private readonly storageKey = 'copyCodeConfig';

  constructor(private readonly storage: vscode.Memento) {}

  public getConfig(): Config {
    const savedConfig = this.storage.get<Config>(this.storageKey);
    return savedConfig ? { ...DEFAULT_CONFIG, ...savedConfig } : { ...DEFAULT_CONFIG };
  }

  public async saveConfig(newConfig: Config): Promise<void> {
    await this.storage.update(this.storageKey, newConfig);
  }
}