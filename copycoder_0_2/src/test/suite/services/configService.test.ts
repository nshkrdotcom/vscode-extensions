import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ConfigService } from '../../../services/configService';
import { Config, DEFAULT_CONFIG } from '../../../models'; // Updated import to match Config

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
        configService = new ConfigService(storage); // Fixed line
    });

    teardown(() => {
        sandbox.restore(); // Moved to teardown for proper cleanup
    });

    test('should return DEFAULT_CONFIG when no saved config exists', () => {
        (storage.get as sinon.SinonStub).returns(undefined);
        const config = configService.getConfig();
        assert.deepStrictEqual(config, DEFAULT_CONFIG);
    });

    test('should merge saved config with DEFAULT_CONFIG', () => {
        const savedConfig: Partial<Config> = {
            includeGlobalExtensions: false,
            projectTypes: ['node'],
            customExtensions: { node: ['.custom'] } // Updated to match Config interface
        };
        (storage.get as sinon.SinonStub).returns(savedConfig);
        const config = configService.getConfig();
        assert.strictEqual(config.includeGlobalExtensions, false);
        assert.deepStrictEqual(config.projectTypes, ['node']);
        assert.deepStrictEqual(config.customExtensions.node, ['.custom']);
        assert.strictEqual(config.filterUsingGitignore, DEFAULT_CONFIG.filterUsingGitignore);
        assert.deepStrictEqual(config.globalBlacklist, DEFAULT_CONFIG.globalBlacklist);
    });

    test('should save config to storage', async () => {
        const newConfig: Config = {
            includeGlobalExtensions: false,
            filterUsingGitignore: true,
            projectTypes: ['python'],
            globalExtensions: ['.py'],
            customExtensions: { python: ['.test'] },
            globalBlacklist: ['__pycache__'],
            customBlacklist: { python: ['test.txt'] }
        };
        await configService.saveConfig(newConfig);
        assert.strictEqual(
            (storage.update as sinon.SinonStub).calledWith('copyCodeConfig', newConfig),
            true,
            'should call storage.update with correct key and config'
        );
    });
});