// src/services/configService.ts
import * as vscode from 'vscode';
import { CopyCodeConfig, DEFAULT_CONFIG } from '../models';

export class ConfigService {
    private readonly storageKey = 'copyCodeConfig';

    constructor(private readonly storage: vscode.Memento) {}

    public getConfig(): CopyCodeConfig {
        const savedConfig = this.storage.get<CopyCodeConfig>(this.storageKey);
        return savedConfig ? { ...DEFAULT_CONFIG, ...savedConfig } : { ...DEFAULT_CONFIG };
    }

    public async saveConfig(newConfig: CopyCodeConfig): Promise<void> {
        await this.storage.update(this.storageKey, newConfig);
    }
}