// src/models/defaultConfig.ts
import { CopyCodeConfig } from './interfaces';

export const DEFAULT_CONFIG: CopyCodeConfig = {
    includeGlobalExtensions: true,
    applyGlobalBlacklist: true,
    enabledProjectTypes: ['powershell', 'python', 'node'],
    customExtensions: [],
    customBlacklist: []
};