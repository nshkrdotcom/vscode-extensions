import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
// import * from 'assert';//import { assert } from 'chai';
import { ConfigTreeDataProvider } from '../../../ui/configTreeDataProvider';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { MockFileSystem } from '../mockFileSystem';

suite('ConfigTreeDataProvider Tests', () => {
  let configService: GlobalConfigService;
  let configTreeProvider: ConfigTreeDataProvider;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    const fileSystem = new MockFileSystem();
    configService = new GlobalConfigService(fileSystem);
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node', 'python'],
      globalExtensions: ['.md', '.txt'],
      customExtensions: { node: ['.js'], python: ['.py'] },
      globalBlacklist: ['node_modules'],
      customBlacklist: { node: ['dist'], python: ['__pycache__'] }
    });
    configTreeProvider = new ConfigTreeDataProvider(configService);
  });

  teardown(() => {
    sandbox.restore(); // Clean up all stubs and spies
  });

  test('getChildren returns root categories', async () => {
    const children = await configTreeProvider.getChildren();
    assert.strictEqual(children.length, 4);
    assert.ok(children.some(c => c.label === 'General'));
    assert.ok(children.some(c => c.label === 'Project Types'));
    assert.ok(children.some(c => c.label === 'Extensions'));
    assert.ok(children.some(c => c.label === 'Blacklist'));
  });

  test('getChildren for General category', async () => {
    const generalItem = { label: 'General', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(generalItem);
    assert.ok(children.some(c => c.label === 'Include Global Extensions'), 'should include Include Global Extensions');
    assert.ok(children.some(c => c.label === 'Filter Using Gitignore'), 'should include Filter Using Gitignore');
    assert.ok(children.some(c => c.label === 'Reset Configuration'), 'should include Reset Configuration');
  });

  test('getChildren for Project Types', async () => {
    const projectTypesItem = { label: 'Project Types', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(projectTypesItem);
    assert.ok(children.some(c => c.label === 'node'));
    assert.ok(children.some(c => c.label === 'python'));
    assert.ok(children.some(c => c.label === 'Add Project Type'));
  });

  test('getChildren for Extensions', async () => {
    const extensionsItem = { label: 'Extensions', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(extensionsItem);
    assert.ok(children.some(c => c.label === 'Global Extensions'));
    assert.ok(children.some(c => c.label === 'Custom Extensions'));
  });

  test('getChildren for Custom Extensions with project type', async () => {
    const nodeItem = { label: 'node', contextValue: 'extensions-custom:node', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(nodeItem);
    assert.strictEqual(children.length, 2, 'should return custom extensions and Add Extension');
    assert.ok(children.some(c => c.label === '.js'), 'should include .js extension');
    assert.ok(children.some(c => c.label === 'Add Extension'), 'should include Add Extension');
    assert.ok(children.some(c => c.contextValue === 'add-project-extension:node'), 'should have correct context value');
  });

  test('getChildren for Global Extensions', async () => {
    const globalExtensionsItem = { label: 'Global Extensions', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(globalExtensionsItem);
    assert.ok(children.some(c => c.label === '.md'));
    assert.ok(children.some(c => c.label === '.txt'));
    assert.ok(children.some(c => c.label === 'Add Global Extension'));
  });

  test('getChildren for Blacklist', async () => {
    const blacklistItem = { label: 'Blacklist', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(blacklistItem);
    assert.ok(children.some(c => c.label === 'Global Blacklist'));
    assert.ok(children.some(c => c.label === 'Custom Blacklist'));
  });

  test('getChildren for Custom Blacklist with project type', async () => {
    const nodeItem = { label: 'node', contextValue: 'blacklist-custom:node', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(nodeItem);
    assert.strictEqual(children.length, 2, 'should return custom blacklist and Add Blacklist Item');
    assert.ok(children.some(c => c.label === 'dist'), 'should include dist blacklist');
    assert.ok(children.some(c => c.label === 'Add Blacklist Item'), 'should include Add Blacklist Item');
    assert.ok(children.some(c => c.contextValue === 'add-project-blacklist:node'), 'should have correct context value');
  });

  test('getChildren for Global Blacklist', async () => {
    const globalBlacklistItem = { label: 'Global Blacklist', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(globalBlacklistItem);
    assert.ok(children.some(c => c.label === 'node_modules'));
    assert.ok(children.some(c => c.label === 'Add Global Blacklist'));
  });

  test('getChildren for Custom Extensions with no extensions', async () => {
    const emptyConfig = {
      includeGlobalExtensions: true,
      filterUsingGitignore: false,
      projectTypes: ['node'],
      globalExtensions: ['.md'],
      customExtensions: { node: [] },
      globalBlacklist: [],
      customBlacklist: {}
    };
    sandbox.restore();
    sandbox.stub(configService, 'getConfig').returns(emptyConfig);

    const nodeItem = { label: 'node', contextValue: 'extensions-custom:node', collapsibleState: vscode.TreeItemCollapsibleState.Expanded };
    const children = await configTreeProvider.getChildren(nodeItem);
    assert.strictEqual(children.length, 1, 'should return only Add Extension');
    assert.ok(children.some(c => c.label === 'Add Extension'), 'should include Add Extension');
    assert.ok(children.some(c => c.contextValue === 'add-project-extension:node'), 'should have correct context value');
  });
});