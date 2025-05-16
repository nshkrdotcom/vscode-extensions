import * as assert from 'assert';
import * as sinon from 'sinon';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { NodeFileSystem } from '../../../services/nodeFileSystem';
import { DEFAULT_CONFIG } from '../../../models/config';

suite('GlobalConfigService Tests', () => {
  let fileSystem: NodeFileSystem;
  let configService: GlobalConfigService;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    fileSystem = new NodeFileSystem();
    configService = new GlobalConfigService(fileSystem);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('getConfig returns default config if file does not exist', () => {
    // Stub the existsSync method directly on the instance
    const existsStub = sandbox.stub(fileSystem, 'existsSync');
    existsStub.returns(false);

    const config = configService.getConfig();

    assert.strictEqual(config.includeGlobalExtensions, DEFAULT_CONFIG.includeGlobalExtensions);
    assert.strictEqual(config.filterUsingGitignore, DEFAULT_CONFIG.filterUsingGitignore);
    assert.strictEqual(config.projectTypes.length, 11, 'should include all project types');
    assert.deepStrictEqual(config.projectTypes, [
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
      'wsl2'
    ]);
    assert.deepStrictEqual(config.globalExtensions, DEFAULT_CONFIG.globalExtensions);
    assert.deepStrictEqual(config.customExtensions, DEFAULT_CONFIG.customExtensions);
    assert.deepStrictEqual(config.globalBlacklist, DEFAULT_CONFIG.globalBlacklist);
    assert.deepStrictEqual(config.customBlacklist, DEFAULT_CONFIG.customBlacklist);
    assert.strictEqual(existsStub.callCount, 2, 'existsSync should be called twice'); // Updated assertion
  });

  test('saveConfig updates custom extensions', () => {
    const config = configService.getConfig();
    config.customExtensions['node'].push('.test');

    // Stub the writeFileSync method directly on the instance
    const writeStub = sandbox.stub(fileSystem, 'writeFileSync');

    configService.saveConfig(config);

    assert.strictEqual(writeStub.calledOnce, true, 'should write updated config to file');
    assert.strictEqual(
      writeStub.calledWithMatch(sinon.match.string, JSON.stringify(config, null, 2), 'utf-8'),
      true,
      'should write the config as JSON'
    );
  });
});