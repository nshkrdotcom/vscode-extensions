// src/test/suite/services/globalConfigService.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as os from 'os';
import * as path from 'path';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { FileSystem } from '../../../services/fileSystem';
import { DEFAULT_EXTENSIONS, DEFAULT_BLACKLIST } from '../../../models/projectTypes';

suite('GlobalConfigService Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let configService: GlobalConfigService;
  let mockFs: FileSystem;
  const configDir = path.join(os.homedir(), '.copycoder');
  const configPath = path.join(configDir, 'config.json');
  const defaultConfig = {
    includeGlobalExtensions: true,
    applyGlobalBlacklist: true,
    filterUsingGitignore: true,
    projectExtensions: { ...DEFAULT_EXTENSIONS },
    globalExtensions: DEFAULT_EXTENSIONS['global'] || [],
    projectBlacklist: { ...DEFAULT_BLACKLIST },
    globalBlacklist: DEFAULT_BLACKLIST['global'] || [],
    enabledProjectTypes: [
      'powershell',
      'terraform',
      'bash',
      'php',
      'mysql',
      'postgres',
      'elixir',
      'python',
      'node',
      'vscode',
      'wsl2',
    ],
    customExtensions: [],
    customBlacklist: [],
  };

  setup(() => {
    sandbox = sinon.createSandbox();
    mockFs = {
      existsSync: sinon.stub(),
      mkdirSync: sinon.stub(),
      readFileSync: sinon.stub(),
      writeFileSync: sinon.stub(),
    };
    configService = new GlobalConfigService(mockFs);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should return default config if file does not exist', () => {
    (mockFs.existsSync as sinon.SinonStub).callsFake((path) => path === configDir);
    const config = configService.getConfig();
    assert.deepStrictEqual(config, defaultConfig, 'Should return default config');
  });

  test('should create config file with default config if missing', () => {
    (mockFs.existsSync as sinon.SinonStub).callsFake((path) => path === configDir);
    (mockFs.mkdirSync as sinon.SinonStub).returns(undefined);
    (mockFs.writeFileSync as sinon.SinonStub).returns(undefined);
    configService.getConfig();
    assert.strictEqual(
      (mockFs.existsSync as sinon.SinonStub).calledWith(configPath),
      true,
      'Should check config file existence'
    );
    assert.strictEqual(
      (mockFs.writeFileSync as sinon.SinonStub).calledWith(
        configPath,
        JSON.stringify(defaultConfig, null, 2),
        'utf8'
      ),
      true,
      'Should write default config'
    );
  });

  test('should merge saved config with default config', () => {
    const savedConfig = {
      includeGlobalExtensions: false,
      applyGlobalBlacklist: true,
      filterUsingGitignore: false,
      projectExtensions: {
        python: ['.py'],
        node: ['.js'],
      },
      globalExtensions: ['.md'],
      projectBlacklist: {
        node: ['node_modules'],
      },
      globalBlacklist: ['.git'],
      enabledProjectTypes: ['python', 'node'],
      customExtensions: ['.custom'],
      customBlacklist: ['temp'],
    };
    (mockFs.existsSync as sinon.SinonStub).returns(true);
    (mockFs.readFileSync as sinon.SinonStub).returns(JSON.stringify(savedConfig));
    const config = configService.getConfig();
    const expectedConfig = {
      ...defaultConfig,
      includeGlobalExtensions: false,
      applyGlobalBlacklist: true,
      filterUsingGitignore: false,
      projectExtensions: {
        ...defaultConfig.projectExtensions,
        python: ['.py'],
        node: ['.js'],
      },
      globalExtensions: ['.md'],
      projectBlacklist: {
        ...defaultConfig.projectBlacklist,
        node: ['node_modules'],
      },
      globalBlacklist: ['.git'],
      enabledProjectTypes: ['python', 'node'],
      customExtensions: ['.custom'],
      customBlacklist: ['temp'],
    };
    assert.deepStrictEqual(config, expectedConfig, 'Should merge saved config with defaults');
  });

  test('should save config to file', () => {
    (mockFs.existsSync as sinon.SinonStub).returns(true);
    (mockFs.writeFileSync as sinon.SinonStub).returns(undefined);
    const newConfig = {
      includeGlobalExtensions: false,
      applyGlobalBlacklist: false,
      filterUsingGitignore: false,
      projectExtensions: {
        python: ['.py'],
      },
      globalExtensions: ['.txt'],
      projectBlacklist: {
        python: ['__pycache__'],
      },
      globalBlacklist: ['temp'],
      enabledProjectTypes: ['python'],
      customExtensions: ['.custom'],
      customBlacklist: ['temp'],
    };
    configService.saveConfig(newConfig);
    assert.strictEqual(
      (mockFs.writeFileSync as sinon.SinonStub).calledWith(
        configPath,
        JSON.stringify(newConfig, null, 2),
        'utf8'
      ),
      true,
      'Should save config to file'
    );
  });

  test('should handle file read errors gracefully', () => {
    sandbox.stub(console, 'error');
    (mockFs.existsSync as sinon.SinonStub).returns(true);
    (mockFs.readFileSync as sinon.SinonStub).throws(new Error('Read error'));
    const config = configService.getConfig();
    assert.deepStrictEqual(
      config,
      defaultConfig,
      'Should return default config on read error'
    );
  });
});