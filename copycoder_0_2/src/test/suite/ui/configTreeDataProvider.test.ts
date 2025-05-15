// src/test/suite/ui/configTreeDataProvider.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../../../ui/configTreeDataProvider';
import { GlobalConfigService } from '../../../services/globalConfigService'; // Fixed import path
import { NodeFileSystem } from '../../../services/fileSystem';

suite('ConfigTreeDataProvider Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let configService: GlobalConfigService;
  let treeProvider: ConfigTreeDataProvider;

  setup(() => {
    sandbox = sinon.createSandbox();
    const fileSystem = new NodeFileSystem();
    configService = new GlobalConfigService(fileSystem);
    treeProvider = new ConfigTreeDataProvider(configService);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should provide root categories', async () => {
    const children = await treeProvider.getChildren();
    assert.strictEqual(children.length, 3, 'Should have 3 root categories');
    assert.strictEqual(children[0].label, 'General', 'First category should be General');
    assert.strictEqual(children[1].label, 'Extensions', 'Second category should be Extensions');
    assert.strictEqual(children[2].label, 'Blacklist', 'Third category should be Blacklist');
    assert.strictEqual(children[0].collapsibleState, vscode.TreeItemCollapsibleState.Collapsed, 'Categories should be collapsible');
  });

  test('should provide General category items', async () => {
    const generalItem = new ConfigTreeItem('General', 'category', vscode.TreeItemCollapsibleState.Collapsed);
    const children = await treeProvider.getChildren(generalItem);
    assert.strictEqual(children.length, 3, 'General should have 3 items');
    assert.strictEqual(children[0].label, 'Include Global Extensions', 'First item should be Include Global Extensions');
    assert.strictEqual(children[1].label, 'Apply Global Blacklist', 'Second item should be Apply Global Blacklist');
    assert.strictEqual(children[2].label, 'Filter Using Gitignore', 'Third item should be Filter Using Gitignore');
    assert.strictEqual(children[0].type, 'boolean', 'Items should be boolean type');
  });

  test('should provide Extensions category items', async () => {
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {
        python: ['.py', '.pyi'],
        typescript: ['.ts', '.tsx'],
      },
      globalExtensions: ['.md', '.txt'],
      projectBlacklist: {
        python: ['__pycache__'],
        typescript: ['dist'],
      },
      globalBlacklist: ['node_modules'],
    });
    const extensionsItem = new ConfigTreeItem('Extensions', 'category', vscode.TreeItemCollapsibleState.Collapsed);
    const children = await treeProvider.getChildren(extensionsItem);
    assert.strictEqual(children.length, 5, 'Extensions should have 2 project types + separator + global + add action');
    assert.strictEqual(children[0].label, 'Python', 'First item should be Python');
    assert.strictEqual(children[0].type, 'projectType', 'First item should be projectType');
    assert.strictEqual(children[1].label, 'Typescript', 'Second item should be TypeScript');
    assert.strictEqual(children[1].type, 'projectType', 'Second item should be projectType');
    assert.strictEqual(children[2].label, '──────────', 'Third item should be separator');
    assert.strictEqual(children[2].type, 'separator', 'Third item should be separator type');
    assert.strictEqual(children[3].label, 'Global Extensions', 'Fourth item should be Global Extensions');
    assert.strictEqual(children[3].type, 'globalExtensions', 'Fourth item should be globalExtensions type');
    assert.strictEqual(children[4].label, 'Add Project Type', 'Fifth item should be Add Project Type');
    assert.strictEqual(children[4].type, 'action', 'Fifth item should be action type');
  });

  test('should provide Python project extensions', async () => {
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {
        python: ['.py', '.pyi'],
        typescript: ['.ts', '.tsx'],
      },
      globalExtensions: ['.md', '.txt'],
      projectBlacklist: {
        python: ['__pycache__'],
        typescript: ['dist'],
      },
      globalBlacklist: ['node_modules'],
    });
    const pythonItem = new ConfigTreeItem('Python', 'projectType', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'python', undefined, undefined, 'Extensions');
    const children = await treeProvider.getChildren(pythonItem);
    assert.strictEqual(children.length, 3, 'Python should have 2 extensions + add action');
    assert.strictEqual(children[0].label, '.py', 'First item should be .py');
    assert.strictEqual(children[0].type, 'listItem', 'First item should be listItem type');
    assert.strictEqual(children[0].projectType, 'python', 'First item should have python projectType');
    assert.strictEqual(children[1].label, '.pyi', 'Second item should be .pyi');
    assert.strictEqual(children[1].type, 'listItem', 'Second item should be listItem type');
    assert.strictEqual(children[2].label, 'Add Extension', 'Third item should be Add Extension');
    assert.strictEqual(children[2].type, 'action', 'Third item should be action type');
  });

  test('should provide Global Extensions items', async () => {
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {
        python: ['.py', '.pyi'],
      },
      globalExtensions: ['.md', '.txt'],
      projectBlacklist: {
        python: ['__pycache__'],
      },
      globalBlacklist: ['node_modules'],
    });
    const globalItem = new ConfigTreeItem('Global Extensions', 'globalExtensions', vscode.TreeItemCollapsibleState.Collapsed);
    const children = await treeProvider.getChildren(globalItem);
    assert.strictEqual(children.length, 3, 'Global Extensions should have 2 items + add action');
    assert.strictEqual(children[0].label, '.md', 'First item should be .md');
    assert.strictEqual(children[0].type, 'listItem', 'First item should be listItem type');
    assert.strictEqual(children[0].projectType, 'global', 'First item should have global projectType');
    assert.strictEqual(children[1].label, '.txt', 'Second item should be .txt');
    assert.strictEqual(children[1].type, 'listItem', 'Second item should be listItem type');
    assert.strictEqual(children[2].label, 'Add Global Extension', 'Third item should be Add Global Extension');
    assert.strictEqual(children[2].type, 'action', 'Third item should be action type');
  });

  test('should provide Blacklist category items', async () => {
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {
        python: ['.py'],
      },
      globalExtensions: ['.md'],
      projectBlacklist: {
        python: ['__pycache__', '.pytest_cache'],
        typescript: ['dist', 'build'],
      },
      globalBlacklist: ['node_modules', '.git'],
    });
    const blacklistItem = new ConfigTreeItem('Blacklist', 'category', vscode.TreeItemCollapsibleState.Collapsed);
    const children = await treeProvider.getChildren(blacklistItem);
    assert.strictEqual(children.length, 5, 'Blacklist should have 2 project types + separator + global + add action');
    assert.strictEqual(children[0].label, 'Python', 'First item should be Python');
    assert.strictEqual(children[0].type, 'projectType', 'First item should be projectType');
    assert.strictEqual(children[1].label, 'Typescript', 'Second item should be TypeScript');
    assert.strictEqual(children[1].type, 'projectType', 'Second item should be projectType');
    assert.strictEqual(children[2].label, '──────────', 'Third item should be separator');
    assert.strictEqual(children[2].type, 'separator', 'Third item should be separator type');
    assert.strictEqual(children[3].label, 'Global Blacklist', 'Fourth item should be Global Blacklist');
    assert.strictEqual(children[3].type, 'globalBlacklist', 'Fourth item should be globalBlacklist type');
    assert.strictEqual(children[4].label, 'Add Project Type', 'Fifth item should be Add Project Type');
    assert.strictEqual(children[4].type, 'action', 'Fifth item should be action type');
  });

  test('should provide TypeScript project blacklist items', async () => {
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {
        typescript: ['.ts'],
      },
      globalExtensions: ['.md'],
      projectBlacklist: {
        typescript: ['dist', 'build'],
      },
      globalBlacklist: ['node_modules'],
    });
    const typescriptItem = new ConfigTreeItem('Typescript', 'projectType', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'typescript', undefined, undefined, 'Blacklist');
    const children = await treeProvider.getChildren(typescriptItem);
    assert.strictEqual(children.length, 3, 'TypeScript should have 2 blacklist items + add action');
    assert.strictEqual(children[0].label, 'dist', 'First item should be dist');
    assert.strictEqual(children[0].type, 'listItem', 'First item should be listItem type');
    assert.strictEqual(children[0].projectType, 'typescript', 'First item should have typescript projectType');
    assert.strictEqual(children[1].label, 'build', 'Second item should be build');
    assert.strictEqual(children[1].type, 'listItem', 'Second item should be listItem type');
    assert.strictEqual(children[2].label, 'Add Blacklist Item', 'Third item should be Add Blacklist Item');
    assert.strictEqual(children[2].type, 'action', 'Third item should be action type');
  });

  test('should provide Global Blacklist items', async () => {
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {
        python: ['.py'],
      },
      globalExtensions: ['.md'],
      projectBlacklist: {
        python: ['__pycache__'],
      },
      globalBlacklist: ['node_modules', '.git'],
    });
    const globalItem = new ConfigTreeItem('Global Blacklist', 'globalBlacklist', vscode.TreeItemCollapsibleState.Collapsed);
    const children = await treeProvider.getChildren(globalItem);
    assert.strictEqual(children.length, 3, 'Global Blacklist should have 2 items + add action');
    assert.strictEqual(children[0].label, 'node_modules', 'First item should be node_modules');
    assert.strictEqual(children[0].type, 'listItem', 'First item should be listItem type');
    assert.strictEqual(children[0].projectType, 'global', 'First item should have global projectType');
    assert.strictEqual(children[1].label, '.git', 'Second item should be .git');
    assert.strictEqual(children[1].type, 'listItem', 'Second item should be listItem type');
    assert.strictEqual(children[2].label, 'Add Global Blacklist Item', 'Third item should be Add Global Blacklist Item');
    assert.strictEqual(children[2].type, 'action', 'Third item should be action type');
  });


  test('should set correct parentLabel for project types', async () => {
    sandbox.stub(configService, 'getConfig').returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: { python: ['.py'] },
      globalExtensions: ['.md'],
      projectBlacklist: { python: ['__pycache__'] },
      globalBlacklist: ['node_modules'],
    });
    const extensionsItem = new ConfigTreeItem('Extensions', 'category', vscode.TreeItemCollapsibleState.Collapsed);
    const children = await treeProvider.getChildren(extensionsItem);
    const pythonItem = children.find(item => item.label === 'Python');
    assert.strictEqual(pythonItem?.parentLabel, 'Extensions', 'Python should have Extensions as parentLabel');
  });

  test('should refresh tree on demand', () => {
    const spy = sandbox.spy(treeProvider['_onDidChangeTreeData'], 'fire');
    treeProvider.refresh();
    assert.strictEqual(spy.calledOnce, true, 'Should fire refresh event');
  });
});