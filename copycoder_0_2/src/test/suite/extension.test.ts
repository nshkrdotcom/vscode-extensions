import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { GlobalConfigService } from '../../services/globalConfigService';
import { FileService } from '../../services/fileService';
import { ClipboardService } from '../../services/clipboardService';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../../ui/configTreeDataProvider';
import { CopyCommandHandler } from '../../handlers/copyCommandHandler';
import { ConfigCommandHandler } from '../../handlers/configCommandHandler';
import { NodeFileSystem } from '../../services/nodeFileSystem';
import { MessageService } from '../../services/messageService';

suite('CopyCoder Extension Tests', () => {
  let context: vscode.ExtensionContext;
  let globalConfigService: GlobalConfigService;
  let fileService: FileService;
  let clipboardService: ClipboardService;
  let configTreeProvider: ConfigTreeDataProvider;
  let copyCommandHandler: CopyCommandHandler;
  let configCommandHandler: ConfigCommandHandler;

  setup(async () => {
    context = {
      subscriptions: [],
      globalState: {
        get: sinon.stub().returns(undefined),
        update: sinon.stub().resolves()
      }
    } as any;
    const fileSystem = new NodeFileSystem();
    globalConfigService = new GlobalConfigService(fileSystem);
    fileService = new FileService(fileSystem);
    clipboardService = new ClipboardService();
    configTreeProvider = new ConfigTreeDataProvider(globalConfigService);
    copyCommandHandler = new CopyCommandHandler(fileService, clipboardService, globalConfigService);
    configCommandHandler = new ConfigCommandHandler(globalConfigService, configTreeProvider);

    sinon.stub(vscode.window, 'showInformationMessage').resolves();
    sinon.stub(vscode.window, 'showErrorMessage').resolves();
    sinon.stub(vscode.window, 'showWarningMessage').resolves();
    sinon.stub(vscode.window, 'showInputBox').resolves();
  });

  teardown(() => {
    sinon.restore();
  });

  test('Copy All Open Files', async () => {
    const editorStub = {
      document: {
        uri: { fsPath: 'test.js' },
        getText: () => 'console.log("Hello");'
      }
    };
    sinon.stub(vscode.window, 'visibleTextEditors').value([editorStub]);
    const clipboardSpy = sinon.spy(clipboardService, 'copyToClipboard');

    await copyCommandHandler.copyOpenFiles();

    assert.ok(clipboardSpy.calledOnce);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Copied content of 1 open files.'));
  });

  test('Copy All Open Files - No Editors', async () => {
    sinon.stub(vscode.window, 'visibleTextEditors').value([]);
    await copyCommandHandler.copyOpenFiles();
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('No open files to copy.'));
  });

  test('Copy All Project Files - No Workspace', async () => {
    sinon.stub(vscode.workspace, 'workspaceFolders').value(undefined);
    await copyCommandHandler.copyFiles();
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('No workspace open to copy files from.'));
  });

  test('Reset Configuration', async () => {
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves('Yes');
    const saveSpy = sinon.spy(globalConfigService, 'saveConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Reset Configuration',
      commandId: 'resetConfig',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'general-resetConfig'
    });

    assert.ok(saveSpy.calledWithMatch({ includeGlobalExtensions: true, filterUsingGitignore: true }));
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Configuration reset to defaults.'));
  });

  test('Reset Configuration - Cancel', async () => {
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves('No');
    const saveSpy = sinon.spy(globalConfigService, 'saveConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Reset Configuration',
      commandId: 'resetConfig',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'general-resetConfig'
    });

    assert.ok(saveSpy.notCalled);
  });

  test('Delete Project Type', async () => {
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves('Yes');
    const config = globalConfigService.getConfig();
    config.projectTypes.push('test');
    globalConfigService.saveConfig(config);

    await configCommandHandler.handleConfigTreeItem({
      label: 'test',
      commandId: 'deleteProjectType',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'projectType'
    });

    const updatedConfig = globalConfigService.getConfig();
    assert.strictEqual(updatedConfig.projectTypes.includes('test'), false);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Project type "test" deleted.'));
  });

  test('Add Project Type', async () => {
    (vscode.window.showInputBox as sinon.SinonStub).resolves('newProject');
    const saveSpy = sinon.spy(globalConfigService, 'saveConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Project Type',
      commandId: 'addProjectType',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-project-type'
    });

    const config = globalConfigService.getConfig();
    assert.ok(config.projectTypes.includes('newProject'));
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Project type "newProject" added.'));
    assert.ok(saveSpy.called);
  });

  test('Add Global Extension', async () => {
    (vscode.window.showInputBox as sinon.SinonStub).resolves('.new');
    const saveSpy = sinon.spy(globalConfigService, 'saveConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Global Extension',
      commandId: 'addGlobalExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-global-extension'
    });

    const config = globalConfigService.getConfig();
    assert.ok(config.globalExtensions.includes('.new'));
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Global extension ".new" added.'));
    assert.ok(saveSpy.called);
  });

  test('Delete Global Extension', async () => {
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves('Yes');
    const config = globalConfigService.getConfig();
    config.globalExtensions.push('.test');
    globalConfigService.saveConfig(config);

    await configCommandHandler.handleConfigTreeItem({
      label: '.test',
      commandId: 'deleteGlobalExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'extensions-global'
    });

    const updatedConfig = globalConfigService.getConfig();
    assert.strictEqual(updatedConfig.globalExtensions.includes('.test'), false);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Global extension ".test" deleted.'));
  });

  test('Add Custom Blacklist', async () => {
    (vscode.window.showInputBox as sinon.SinonStub).resolves('testDir');
    const config = globalConfigService.getConfig();
    config.projectTypes = ['node'];
    globalConfigService.saveConfig(config);

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Blacklist Item',
      commandId: 'addCustomBlacklist',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-project-blacklist:node'
    });

    const updatedConfig = globalConfigService.getConfig();
    assert.ok(updatedConfig.customBlacklist['node'].includes('testDir'));
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Blacklist item "testDir" added for "node".'));
  });
});