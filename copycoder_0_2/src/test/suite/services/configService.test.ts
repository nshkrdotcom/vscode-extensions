// src/test/suite/services/configService.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ConfigService } from '../../../services/configService';
import { CopyCodeConfig, DEFAULT_CONFIG } from '../../../models';

suite('ConfigService Tests', () => {
    let storage: vscode.Memento;
    let configService: ConfigService;
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
        // Mock the Memento storage
        storage = {
            get: sandbox.stub(),
            update: sandbox.stub().resolves(),
            keys: () => []
        } as any;
        configService = new ConfigService(storage);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should return DEFAULT_CONFIG when no saved config exists', () => {
        (storage.get as sinon.SinonStub).returns(undefined);
        const config = configService.getConfig();
        assert.deepStrictEqual(config, DEFAULT_CONFIG);
    });

    test('should merge saved config with DEFAULT_CONFIG', () => {
        const savedConfig: Partial<CopyCodeConfig> = {
            includeGlobalExtensions: false,
            enabledProjectTypes: ['node'],
            customExtensions: ['.custom']
        };
        (storage.get as sinon.SinonStub).returns(savedConfig);
        const config = configService.getConfig();
        assert.strictEqual(config.includeGlobalExtensions, false);
        assert.deepStrictEqual(config.enabledProjectTypes, ['node']);
        assert.deepStrictEqual(config.customExtensions, ['.custom']);
        assert.strictEqual(config.applyGlobalBlacklist, DEFAULT_CONFIG.applyGlobalBlacklist); // From default
        assert.deepStrictEqual(config.customBlacklist, DEFAULT_CONFIG.customBlacklist); // From default
    });

    test('should save config to storage', async () => {
        const newConfig: CopyCodeConfig = {
            includeGlobalExtensions: false,
            applyGlobalBlacklist: true,
            enabledProjectTypes: ['python'],
            customExtensions: ['.test'],
            customBlacklist: ['test.txt']
        };
        await configService.saveConfig(newConfig);
        assert.strictEqual(
            (storage.update as sinon.SinonStub).calledWith('copyCodeConfig', newConfig),
            true,
            'should call storage.update with correct key and config'
        );
    });
});