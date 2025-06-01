import * as assert from 'assert';
import * as sinon from 'sinon';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { MockFileSystem } from '../mockFileSystem';
// import { DEFAULT_CONFIG } from '../../../models/config';

suite('GlobalConfigService Tests', () => {
  let fileSystem: MockFileSystem;
  let configService: GlobalConfigService;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    fileSystem = new MockFileSystem();
    configService = new GlobalConfigService(fileSystem);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('getConfig returns default config if file does not exist', () => {
    const existsStub = sandbox.stub(fileSystem, 'existsSync').returns(false);
    const config = configService.getConfig();

    assert.strictEqual(config.includeGlobalExtensions, true, 'includeGlobalExtensions should be true');
    assert.strictEqual(config.filterUsingGitignore, false, 'filterUsingGitignore should be false');
    assert.deepStrictEqual(config.projectTypes, [], 'should have no project types by default');
    assert.deepStrictEqual(config.globalExtensions, ['.md'], 'should have default global extensions');
    assert.deepStrictEqual(config.customExtensions, {}, 'should have empty custom extensions');
    assert.deepStrictEqual(config.globalBlacklist, [], 'should have empty global blacklist');
    assert.deepStrictEqual(config.customBlacklist, {}, 'should have empty custom blacklist');
    assert.strictEqual(existsStub.calledOnce, true, 'existsSync should be called once');
  });

  test('saveConfig updates custom extensions', async () => {
    const writeStub = sandbox.stub(fileSystem, 'writeFileSync');
    const config = configService.getConfig();
    config.customExtensions['node'] = ['.js'];
    await configService.updateConfig(config);
    assert.ok(writeStub.calledOnce, 'writeFileSync should be called');
    const savedData = writeStub.firstCall.args[1];
    const savedConfig = JSON.parse(savedData);
    assert.deepStrictEqual(savedConfig.customExtensions['node'], ['.js'], 'custom extensions should be saved');
  });

  test('resetConfig restores default values', async () => {
    const config = configService.getConfig();
    config.includeGlobalExtensions = false;
    config.projectTypes = ['test'];
    await configService.updateConfig(config);

    configService.resetConfig();
    const resetConfig = configService.getConfig();

    assert.strictEqual(resetConfig.includeGlobalExtensions, true, 'should restore default includeGlobalExtensions');
    assert.deepStrictEqual(resetConfig.projectTypes, [], 'should restore empty project types');
  });

  test('updateConfig merges partial updates', async () => {
    // Create a new MockFileSystem instance
    const testFileSystem = new MockFileSystem();
    
    // Create a stub for writeFileSync to track calls
    const writeStub = sandbox.stub(testFileSystem, 'writeFileSync');
    
    // Create a GlobalConfigService instance with our stubbed file system
    const testConfigService = new GlobalConfigService(testFileSystem);
    
    // Ensure the internal config is set to match tests
    // @ts-ignore - accessing private property for testing
    testConfigService.config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: [],
      globalExtensions: ['.md'],
      customExtensions: {},
      globalBlacklist: [],
      customBlacklist: {}
    };
    
    // Apply a partial update - this should now call the stubbed writeFileSync synchronously
    await testConfigService.updateConfig({
      includeGlobalExtensions: false
    });
    
    // Verify writeFileSync was called
    assert.ok(writeStub.called, 'writeFileSync should be called');
    
    // Verify the config was updated correctly
    // @ts-ignore - accessing private property for testing
    assert.strictEqual(testConfigService.config.includeGlobalExtensions, false, 
      'includeGlobalExtensions should be updated to false');
  });
});