import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../../../ui/configTreeDataProvider';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { NodeFileSystem } from '../../../services/nodeFileSystem';
import { Config } from '../../../models/config';

suite('ConfigTreeDataProvider Tests', () => {
  let configService: GlobalConfigService;
  let treeDataProvider: ConfigTreeDataProvider;

  setup(() => {
    const fileSystem = new NodeFileSystem();
    configService = new GlobalConfigService(fileSystem);
    treeDataProvider = new ConfigTreeDataProvider(configService);
    sinon.stub(vscode.window, 'showInformationMessage');
  });

  teardown(() => {
    sinon.restore();
  });

  test('getChildren returns root categories', async () => {
    const children = await treeDataProvider.getChildren();
    assert.strictEqual(children.length, 4, 'Should return 4 root categories');
    assert.strictEqual(children[0].label, 'General');
    assert.strictEqual(children[0].contextValue, 'category');
    assert.strictEqual(children[1].label, 'Project Types');
    assert.strictEqual(children[2].label, 'Extensions');
    assert.strictEqual(children[3].label, 'Blacklist');
  });

  test('getChildren for General category', async () => {
    const generalItem = new ConfigTreeItem('General', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category');
    const children = await treeDataProvider.getChildren(generalItem);
    assert.strictEqual(children.length, 3, 'General should have 3 children');
    assert.strictEqual(children[0].contextValue, 'general-includeGlobalExtensions');
    assert.strictEqual(children[1].contextValue, 'general-filterUsingGitignore');
    assert.strictEqual(children[2].contextValue, 'general-resetConfig');
  });

  test('getChildren for Project Types', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['node', 'python'],
      globalExtensions: [],
      customExtensions: { node: [], python: [] },
      globalBlacklist: [],
      customBlacklist: { node: [], python: [] }
    });
    const projectTypesItem = new ConfigTreeItem('Project Types', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category');
    const children = await treeDataProvider.getChildren(projectTypesItem);
    assert.strictEqual(children.length, 3, 'Project Types should have 3 children');
    assert.strictEqual(children[0].label, 'node');
    assert.strictEqual(children[0].contextValue, 'projectType');
    assert.strictEqual(children[1].label, 'python');
    assert.strictEqual(children[2].contextValue, 'add-project-type');
  });

  test('getChildren for Extensions', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['python'],
      globalExtensions: [],
      customExtensions: { python: ['.custom'] },
      globalBlacklist: [],
      customBlacklist: { python: [] }
    });
    const extensionsItem = new ConfigTreeItem('Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category');
    const children = await treeDataProvider.getChildren(extensionsItem);
    assert.strictEqual(children.length, 2, 'Extensions should have 2 children');
    assert.strictEqual(children[0].contextValue, 'extensions-global-list');
    assert.strictEqual(children[1].contextValue, 'extensions-custom-list');
  });

  test('getChildren for Custom Extensions with project type', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['python'],
      globalExtensions: [],
      customExtensions: { python: ['.custom'] },
      globalBlacklist: [],
      customBlacklist: { python: [] }
    });
    const pythonItem = new ConfigTreeItem('python', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'extensions-project-list', 'Custom Extensions');
    const children = await treeDataProvider.getChildren(pythonItem);
    assert.strictEqual(children.length, 2, 'Python custom extensions should have 2 children');
    assert.strictEqual(children[0].label, '.custom');
    assert.strictEqual(children[0].contextValue, 'extensions-project:python:.custom');
    assert.strictEqual(children[1].contextValue, 'add-project-extension:python');
  });

  test('getChildren for Global Extensions', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: [],
      globalExtensions: ['.js', '.ts'],
      customExtensions: {},
      globalBlacklist: [],
      customBlacklist: {}
    });
    const globalExtensionsItem = new ConfigTreeItem('Global Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, 'extensions-global-list');
    const children = await treeDataProvider.getChildren(globalExtensionsItem);
    assert.strictEqual(children.length, 3, 'Global Extensions should have 3 children');
    assert.strictEqual(children[0].label, '.js');
    assert.strictEqual(children[0].contextValue, 'extensions-global');
    assert.strictEqual(children[1].label, '.ts');
    assert.strictEqual(children[2].contextValue, 'add-global-extension');
  });

  test('getChildren for Blacklist', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['typescript'],
      globalExtensions: [],
      customExtensions: { typescript: [] },
      globalBlacklist: [],
      customBlacklist: { typescript: ['temp'] }
    });
    const blacklistItem = new ConfigTreeItem('Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category');
    const children = await treeDataProvider.getChildren(blacklistItem);
    assert.strictEqual(children.length, 2, 'Blacklist should have 2 children');
    assert.strictEqual(children[0].contextValue, 'blacklist-global-list');
    assert.strictEqual(children[1].contextValue, 'blacklist-custom-list');
  });

  test('getChildren for Custom Blacklist with project type', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['typescript'],
      globalExtensions: [],
      customExtensions: { typescript: [] },
      globalBlacklist: [],
      customBlacklist: { typescript: ['temp'] }
    });
    const typescriptItem = new ConfigTreeItem('typescript', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'blacklist-project-list', 'Custom Blacklist');
    const children = await treeDataProvider.getChildren(typescriptItem);
    assert.strictEqual(children.length, 2, 'Typescript custom blacklist should have 2 children');
    assert.strictEqual(children[0].label, 'temp');
    assert.strictEqual(children[0].contextValue, 'blacklist-project:typescript:temp');
    assert.strictEqual(children[1].contextValue, 'add-project-blacklist:typescript');
  });

  test('getChildren for Global Blacklist', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: [],
      globalExtensions: [],
      customExtensions: {},
      globalBlacklist: ['node_modules', 'dist'],
      customBlacklist: {}
    });
    const globalBlacklistItem = new ConfigTreeItem('Global Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, 'blacklist-global-list');
    const children = await treeDataProvider.getChildren(globalBlacklistItem);
    assert.strictEqual(children.length, 3, 'Global Blacklist should have 3 children');
    assert.strictEqual(children[0].label, 'node_modules');
    assert.strictEqual(children[0].contextValue, 'blacklist-global');
    assert.strictEqual(children[1].label, 'dist');
    assert.strictEqual(children[2].contextValue, 'add-global-blacklist');
  });

  test('getChildren for Custom Extensions with no extensions', async () => {
    sinon.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['custom'],
      globalExtensions: [],
      customExtensions: { custom: [] },
      globalBlacklist: [],
      customBlacklist: { custom: [] }
    });
    const customItem = new ConfigTreeItem('custom', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'extensions-project-list', 'Custom Extensions');
    const children = await treeDataProvider.getChildren(customItem);
    assert.strictEqual(children.length, 1, 'Custom extensions with no items should have 1 child');
    assert.strictEqual(children[0].contextValue, 'add-project-extension:custom');
  });
});