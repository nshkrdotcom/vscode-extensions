// src/test/suite/services/globalConfigService.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as os from 'os';
import * as path from 'path';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { FileSystem } from '../../../services/fileSystem';

suite('GlobalConfigService Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let configService: GlobalConfigService;
  let mockFs: FileSystem;
  const configDir = path.join(os.homedir(), '.copycoder');
  const configPath = path.join(configDir, 'config.json');
  const defaultConfig = {
    includeGlobalExtensions: true,
    applyGlobalBlacklist: true,
    extensions: ['.js', '.ts', '.md'],
    blacklist: ['node_modules', 'dist'],
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
      extensions: ['.py'],
    };
    (mockFs.existsSync as sinon.SinonStub).returns(true);
    (mockFs.readFileSync as sinon.SinonStub).returns(JSON.stringify(savedConfig));
    const config = configService.getConfig();
    assert.deepStrictEqual(
      config,
      {
        includeGlobalExtensions: false,
        applyGlobalBlacklist: true,
        extensions: ['.py'],
        blacklist: ['node_modules', 'dist'],
      },
      'Should merge saved config with defaults'
    );
  });

  test('should save config to file', () => {
    (mockFs.existsSync as sinon.SinonStub).returns(true);
    (mockFs.writeFileSync as sinon.SinonStub).returns(undefined);
    const newConfig = {
      includeGlobalExtensions: false,
      applyGlobalBlacklist: false,
      extensions: ['.js'],
      blacklist: ['temp'],
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
      sandbox.stub(console, 'error'); // Suppress console.error output
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