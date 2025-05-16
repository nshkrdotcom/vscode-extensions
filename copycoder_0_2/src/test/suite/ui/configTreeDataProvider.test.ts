// src/test/suite/ui/configTreeDataProvider.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../../../ui/configTreeDataProvider';
import { GlobalConfigService } from '../../../services/globalConfigService';
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
    assert.strictEqual(children.length, 4, 'Should have 4 root categories');
    assert.strictEqual(children[0].label, 'General', 'First category should be General');
    assert.strictEqual(children[1].label, 'Project Types', 'Second category should be Project Types');
    assert.strictEqual(children[2].label, 'Extensions', 'Third category should be Extensions');
    assert.strictEqual(children[3].label, 'Blacklist', 'Fourth category should be Blacklist');
    assert.strictEqual(children[0].collapsibleState, vscode.TreeItemCollapsibleState.Expanded, 'Categories should be collapsible');
    assert.strictEqual(children[0].type, 'category', 'Categories should have category type');
  });

  test('should provide General category items', async () => {
    const generalItem = new ConfigTreeItem('General', vscode.TreeItemCollapsibleState.Collapsed, 'category');
    const children = await treeProvider.getChildren(generalItem);
    assert.strictEqual(children.length, 3, 'General should have 3 items');
    assert.strictEqual(children[0].label, 'Include Global Extensions', 'First item should be Include Global Extensions');
    assert.strictEqual(children[1].label, 'Apply Global Blacklist', 'Second item should be Apply Global Blacklist');
    assert.strictEqual(children[2].label, 'Filter Using .gitignore', 'Third item should be Filter Using .gitignore');
    assert.strictEqual(children[0].type, 'general-includeGlobalExtensions', 'First item should have correct type');
  });

  test('should provide Project Types category items', async () => {
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
      enabledProjectTypes: ['python', 'typescript'],
      customExtensions: [],
      customBlacklist: [],
    });
    const projectTypesItem = new ConfigTreeItem('Project Types', vscode.TreeItemCollapsibleState.Collapsed, 'category');
    const children = await treeProvider.getChildren(projectTypesItem);
    assert.strictEqual(children.length, 3, 'Project Types should have 2 project types + add action');
    assert.strictEqual(children[0].label, 'python', 'First item should be python');
    assert.strictEqual(children[0].type, 'projectType', 'First item should be projectType');
    assert.strictEqual(children[1].label, 'typescript', 'Second item should be typescript');
    assert.strictEqual(children[1].type, 'projectType', 'Second item should be projectType');
    assert.strictEqual(children[2].label, 'Add Project Type', 'Third item should be Add Project Type');
    assert.strictEqual(children[2].type, 'add-project-type', 'Third item should be add-project-type');
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
      enabledProjectTypes: ['python', 'typescript'],
      customExtensions: ['.custom'],
      customBlacklist: [],
    });
    const extensionsItem = new ConfigTreeItem('Extensions', vscode.TreeItemCollapsibleState.Collapsed, 'category');
    const children = await treeProvider.getChildren(extensionsItem);
    assert.strictEqual(children.length, 4, 'Extensions should have global + custom + 2 project types');
    assert.strictEqual(children[0].label, 'Global Extensions', 'First item should be Global Extensions');
    assert.strictEqual(children[0].type, 'extensions-global-list', 'First item should be extensions-global-list');
    assert.strictEqual(children[1].label, 'Custom Extensions', 'Second item should be Custom Extensions');
    assert.strictEqual(children[1].type, 'extensions-custom-list', 'Second item should be extensions-custom-list');
    assert.strictEqual(children[2].label, 'python', 'Third item should be python');
    assert.strictEqual(children[2].type, 'extensions-project-list', 'Third item should be extensions-project-list');
    assert.strictEqual(children[3].label, 'typescript', 'Fourth item should be typescript');
    assert.strictEqual(children[3].type, 'extensions-project-list', 'Fourth item should be extensions-project-list');
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
      enabledProjectTypes: ['python', 'typescript'],
      customExtensions: [],
      customBlacklist: [],
    });
    const pythonItem = new ConfigTreeItem(
      'python',
      vscode.TreeItemCollapsibleState.Collapsed,
      'extensions-project-list',
      'python',
      'Extensions',
      'python'
    );
    const children = await treeProvider.getChildren(pythonItem);
    assert.strictEqual(children.length, 3, 'Python should have 2 extensions + add action');
    assert.strictEqual(children[0].label, '.py', 'First item should be .py');
    assert.strictEqual(children[0].type, 'extensions-project', 'First item should be extensions-project');
    assert.strictEqual(children[0].projectType, 'python', 'First item should have python projectType');
    assert.strictEqual(children[1].label, '.pyi', 'Second item should be .pyi');
    assert.strictEqual(children[1].type, 'extensions-project', 'Second item should be extensions-project');
    assert.strictEqual(children[2].label, 'Add Extension', 'Third item should be Add Extension');
    assert.strictEqual(children[2].type, 'add-project-extension', 'Third item should be add-project-extension');
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
      enabledProjectTypes: ['python'],
      customExtensions: [],
      customBlacklist: [],
    });
    const globalItem = new ConfigTreeItem(
      'Global Extensions',
      vscode.TreeItemCollapsibleState.Collapsed,
      'extensions-global-list'
    );
    const children = await treeProvider.getChildren(globalItem);
    assert.strictEqual(children.length, 3, 'Global Extensions should have 2 items + add action');
    assert.strictEqual(children[0].label, '.md', 'First item should be .md');
    assert.strictEqual(children[0].type, 'extensions-global', 'First item should be extensions-global');
    assert.strictEqual(children[0].projectType, 'global', 'First item should have global projectType');
    assert.strictEqual(children[1].label, '.txt', 'Second item should be .txt');
    assert.strictEqual(children[1].type, 'extensions-global', 'Second item should be extensions-global');
    assert.strictEqual(children[2].label, 'Add Global Extension', 'Third item should be Add Global Extension');
    assert.strictEqual(children[2].type, 'add-global-extension', 'Third item should be add-global-extension');
  });

  test('should provide Custom Extensions items', async () => {
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
      enabledProjectTypes: ['python'],
      customExtensions: ['.custom'],
      customBlacklist: [],
    });
    const customItem = new ConfigTreeItem(
      'Custom Extensions',
      vscode.TreeItemCollapsibleState.Collapsed,
      'extensions-custom-list'
    );
    const children = await treeProvider.getChildren(customItem);
    assert.strictEqual(children.length, 2, 'Custom Extensions should have 1 item + add action');
    assert.strictEqual(children[0].label, '.custom', 'First item should be .custom');
    assert.strictEqual(children[0].type, 'extensions-custom', 'First item should be extensions-custom');
    assert.strictEqual(children[0].projectType, 'custom', 'First item should have custom projectType');
    assert.strictEqual(children[1].label, 'Add Custom Extension', 'Second item should be Add Custom Extension');
    assert.strictEqual(children[1].type, 'add-custom-extension', 'Second item should be add-custom-extension');
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
      enabledProjectTypes: ['python', 'typescript'],
      customExtensions: [],
      customBlacklist: ['temp'],
    });
    const blacklistItem = new ConfigTreeItem('Blacklist', vscode.TreeItemCollapsibleState.Collapsed, 'category');
    const children = await treeProvider.getChildren(blacklistItem);
    assert.strictEqual(children.length, 4, 'Blacklist should have global + custom + 2 project types');
    assert.strictEqual(children[0].label, 'Global Blacklist', 'First item should be Global Blacklist');
    assert.strictEqual(children[0].type, 'blacklist-global-list', 'First item should be blacklist-global-list');
    assert.strictEqual(children[1].label, 'Custom Blacklist', 'Second item should be Custom Blacklist');
    assert.strictEqual(children[1].type, 'blacklist-custom-list', 'Second item should be blacklist-custom-list');
    assert.strictEqual(children[2].label, 'python', 'Third item should be python');
    assert.strictEqual(children[2].type, 'blacklist-project-list', 'Third item should be blacklist-project-list');
    assert.strictEqual(children[3].label, 'typescript', 'Fourth item should be typescript');
    assert.strictEqual(children[3].type, 'blacklist-project-list', 'Fourth item should be blacklist-project-list');
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
      enabledProjectTypes: ['typescript'],
      customExtensions: [],
      customBlacklist: [],
    });
    const typescriptItem = new ConfigTreeItem(
      'typescript',
      vscode.TreeItemCollapsibleState.Collapsed,
      'blacklist-project-list',
      'typescript',
      'Blacklist',
      'typescript'
    );
    const children = await treeProvider.getChildren(typescriptItem);
    assert.strictEqual(children.length, 3, 'Typescript should have 2 blacklist items + add action');
    assert.strictEqual(children[0].label, 'dist', 'First item should be dist');
    assert.strictEqual(children[0].type, 'blacklist-project', 'First item should be blacklist-project');
    assert.strictEqual(children[0].projectType, 'typescript', 'First item should have typescript projectType');
    assert.strictEqual(children[1].label, 'build', 'Second item should be build');
    assert.strictEqual(children[1].type, 'blacklist-project', 'Second item should be blacklist-project');
    assert.strictEqual(children[2].label, 'Add Blacklist Item', 'Third item should be Add Blacklist Item');
    assert.strictEqual(children[2].type, 'add-project-blacklist', 'Third item should be add-project-blacklist');
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
      enabledProjectTypes: ['python'],
      customExtensions: [],
      customBlacklist: [],
    });
    const globalItem = new ConfigTreeItem(
      'Global Blacklist',
      vscode.TreeItemCollapsibleState.Collapsed,
      'blacklist-global-list'
    );
    const children = await treeProvider.getChildren(globalItem);
    assert.strictEqual(children.length, 3, 'Global Blacklist should have 2 items + add action');
    assert.strictEqual(children[0].label, 'node_modules', 'First item should be node_modules');
    assert.strictEqual(children[0].type, 'blacklist-global', 'First item should be blacklist-global');
    assert.strictEqual(children[0].projectType, 'global', 'First item should have global projectType');
    assert.strictEqual(children[1].label, '.git', 'Second item should be .git');
    assert.strictEqual(children[1].type, 'blacklist-global', 'Second item should be blacklist-global');
    assert.strictEqual(children[2].label, 'Add Global Blacklist Item', 'Third item should be Add Global Blacklist Item');
    assert.strictEqual(children[2].type, 'add-global-blacklist', 'Third item should be add-global-blacklist');
  });

  test('should provide Custom Blacklist items', async () => {
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
      globalBlacklist: ['node_modules'],
      enabledProjectTypes: ['python'],
      customExtensions: [],
      customBlacklist: ['temp'],
    });
    const customItem = new ConfigTreeItem(
      'Custom Blacklist',
      vscode.TreeItemCollapsibleState.Collapsed,
      'blacklist-custom-list'
    );
    const children = await treeProvider.getChildren(customItem);
    assert.strictEqual(children.length, 2, 'Custom Blacklist should have 1 item + add action');
    assert.strictEqual(children[0].label, 'temp', 'First item should be temp');
    assert.strictEqual(children[0].type, 'blacklist-custom', 'First item should be blacklist-custom');
    assert.strictEqual(children[0].projectType, 'custom', 'First item should have custom projectType');
    assert.strictEqual(children[1].label, 'Add Custom Blacklist Item', 'Second item should be Add Custom Blacklist Item');
    assert.strictEqual(children[1].type, 'add-custom-blacklist', 'Second item should be add-custom-blacklist');
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
      enabledProjectTypes: ['python'],
      customExtensions: [],
      customBlacklist: [],
    });
    const extensionsItem = new ConfigTreeItem('Extensions', vscode.TreeItemCollapsibleState.Collapsed, 'category');
    const children = await treeProvider.getChildren(extensionsItem);
    const pythonItem = children.find((item) => item.label === 'python');
    assert.strictEqual(pythonItem?.parentLabel, 'Extensions', 'Python should have Extensions as parentLabel');
  });

  test('should refresh tree on demand', () => {
    const spy = sandbox.spy(treeProvider['_onDidChangeTreeData'], 'fire');
    treeProvider.refresh();
    assert.strictEqual(spy.calledOnce, true, 'Should fire refresh event');
  });
});