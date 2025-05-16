import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { GlobalConfigService } from '../../services/globalConfigService';
import { FileService } from '../../services/fileService';
import { ClipboardService } from '../../services/clipboardService';
import { ConfigTreeDataProvider } from '../../ui/configTreeDataProvider';
import { CopyCommandHandler } from '../../handlers/copyCommandHandler';
import { ConfigCommandHandler } from '../../handlers/configCommandHandler';
import { MockFileSystem } from './mockFileSystem';
import { Config } from '../../models/config';

suite('CopyCoder Extension Tests', () => {
  let globalConfigService: GlobalConfigService;
  let fileService: FileService;
  let clipboardService: ClipboardService;
  let configTreeProvider: ConfigTreeDataProvider;
  let copyCommandHandler: CopyCommandHandler;
  let configCommandHandler: ConfigCommandHandler;
  let sandbox: sinon.SinonSandbox;

  setup(async () => {
    sandbox = sinon.createSandbox();
    const fileSystem = new MockFileSystem();

    console.log('DEBUG: ***************************************** * * * ** * ** **********Test suite running');

    globalConfigService = new GlobalConfigService(fileSystem);
    fileService = new FileService(fileSystem);
    clipboardService = new ClipboardService();
    configTreeProvider = new ConfigTreeDataProvider(globalConfigService);
    copyCommandHandler = new CopyCommandHandler(fileService, clipboardService, globalConfigService);
    configCommandHandler = new ConfigCommandHandler(globalConfigService, configTreeProvider);

    sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox.stub(vscode.window, 'showWarningMessage').resolves({ title: 'Yes' } as vscode.MessageItem);
    sandbox.stub(vscode.window, 'showInputBox').resolves('test');
  });

  teardown(() => {
    sandbox.restore();
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
    // Create mock dependencies
    const mockFileSystem = new MockFileSystem();
    
    // Create GlobalConfigService with methods we can spy on
    class TestGlobalConfigService extends GlobalConfigService {
      deleteConfigCalled = false;
      resetConfigCalled = false;
      
      async deleteConfig(): Promise<void> {
        this.deleteConfigCalled = true;
        return super.deleteConfig();
      }
      
      async resetConfig(): Promise<void> {
        this.resetConfigCalled = true;
        return super.resetConfig();
      }
    }
    
    // Create a tracking TreeProvider
    class TestConfigTreeProvider extends ConfigTreeDataProvider {
      refreshCalled = false;
      
      refresh(): void {
        this.refreshCalled = true;
        super.refresh();
      }
    }
    
    // Instantiate our test classes
    const testGlobalConfigService = new TestGlobalConfigService(mockFileSystem);
    const testConfigTreeProvider = new TestConfigTreeProvider(testGlobalConfigService);
    const testConfigCommandHandler = new ConfigCommandHandler(testGlobalConfigService, testConfigTreeProvider);
    
    // Ensure showWarningMessage returns 'Yes'
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves('Yes');
    
    // Execute the command
    await testConfigCommandHandler.handleConfigTreeItem({
      label: 'Reset Configuration',
      commandId: 'resetConfig',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'general-resetConfig'
    });
    
    // Check that our methods were called
    assert.ok(testGlobalConfigService.deleteConfigCalled, 'deleteConfig should be called');
    assert.ok(testGlobalConfigService.resetConfigCalled, 'resetConfig should be called');
    assert.ok(testConfigTreeProvider.refreshCalled, 'refresh should be called');
  });

  test('Reset Configuration - Cancel', async () => {
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves({ title: 'No' } as vscode.MessageItem);
    const resetSpy = sandbox.spy(globalConfigService, 'resetConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Reset Configuration',
      commandId: 'resetConfig',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'general-resetConfig'
    });

    assert.ok(resetSpy.notCalled);
  });

  test('Delete Project Type', async () => {
    // Create mock dependencies
    const mockFileSystem = new MockFileSystem();
    
    // Create GlobalConfigService with methods we can spy on
    class TestGlobalConfigService extends GlobalConfigService {
      updateConfigCalled = false;
      
      async updateConfig(updates: Partial<Config>): Promise<void> {
        this.updateConfigCalled = true;
        return super.updateConfig(updates);
      }
      
      getConfig(): Config {
        return {
          ...super.getConfig(),
          projectTypes: ['test']
        };
      }
    }
    
    // Create a tracking TreeProvider
    class TestConfigTreeProvider extends ConfigTreeDataProvider {
      refreshCalled = false;
      
      refresh(): void {
        this.refreshCalled = true;
        super.refresh();
      }
    }
    
    // Instantiate our test classes
    const testGlobalConfigService = new TestGlobalConfigService(mockFileSystem);
    const testConfigTreeProvider = new TestConfigTreeProvider(testGlobalConfigService);
    const testConfigCommandHandler = new ConfigCommandHandler(testGlobalConfigService, testConfigTreeProvider);
    
    // Ensure showWarningMessage returns 'Yes'
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves('Yes');
    
    // Execute the command
    await testConfigCommandHandler.handleConfigTreeItem({
      label: 'test',
      commandId: 'deleteProjectType',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'projectType'
    });
    
    // Check that our methods were called
    assert.ok(testGlobalConfigService.updateConfigCalled, 'updateConfig should be called');
    assert.ok(testConfigTreeProvider.refreshCalled, 'refresh should be called');
  });

  test('Add Project Type', async () => {
    const refreshSpy = sinon.stub(configTreeProvider, 'refresh');
    const updateConfigStub = sinon.stub(globalConfigService, 'updateConfig').resolves();

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Project Type',
      commandId: 'addProjectType',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-project-type'
    });

    assert.ok(updateConfigStub.calledOnce, 'updateConfig should be called');
    assert.ok(refreshSpy.calledOnce, 'refresh should be called');
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).called, 'showInformationMessage should be called');
  });

  test('Add Global Extension', async () => {
    const refreshSpy = sinon.stub(configTreeProvider, 'refresh');
    const updateConfigStub = sinon.stub(globalConfigService, 'updateConfig').resolves();

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Global Extension',
      commandId: 'addGlobalExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-global-extension'
    });

    assert.ok(updateConfigStub.calledOnce, 'updateConfig should be called');
    assert.ok(refreshSpy.calledOnce, 'refresh should be called');
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).called, 'showInformationMessage should be called');
  });

  test('Delete Global Extension', async () => {
    // Create mock dependencies
    const mockFileSystem = new MockFileSystem();
    
    // Create GlobalConfigService with methods we can spy on
    class TestGlobalConfigService extends GlobalConfigService {
      updateConfigCalled = false;
      
      async updateConfig(updates: Partial<Config>): Promise<void> {
        this.updateConfigCalled = true;
        return super.updateConfig(updates);
      }
      
      getConfig(): Config {
        return {
          ...super.getConfig(),
          globalExtensions: [...super.getConfig().globalExtensions, '.test']
        };
      }
    }
    
    // Create a tracking TreeProvider
    class TestConfigTreeProvider extends ConfigTreeDataProvider {
      refreshCalled = false;
      
      refresh(): void {
        this.refreshCalled = true;
        super.refresh();
      }
    }
    
    // Instantiate our test classes
    const testGlobalConfigService = new TestGlobalConfigService(mockFileSystem);
    const testConfigTreeProvider = new TestConfigTreeProvider(testGlobalConfigService);
    const testConfigCommandHandler = new ConfigCommandHandler(testGlobalConfigService, testConfigTreeProvider);
    
    // Ensure showWarningMessage returns 'Yes'
    (vscode.window.showWarningMessage as sinon.SinonStub).resolves('Yes');
    
    // Execute the command
    await testConfigCommandHandler.handleConfigTreeItem({
      label: '.test',
      commandId: 'deleteGlobalExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'extensions-global'
    });
    
    // Check that our methods were called
    assert.ok(testGlobalConfigService.updateConfigCalled, 'updateConfig should be called');
    assert.ok(testConfigTreeProvider.refreshCalled, 'refresh should be called');
  });

  test('Add Custom Blacklist', async () => {
    const refreshSpy = sinon.stub(configTreeProvider, 'refresh');
    const updateConfigStub = sinon.stub(globalConfigService, 'updateConfig').resolves();

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Blacklist Item',
      commandId: 'addCustomBlacklist',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-project-blacklist:node'
    });

    assert.ok(updateConfigStub.calledOnce, 'updateConfig should be called');
    assert.ok(refreshSpy.calledOnce, 'refresh should be called');
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).called, 'showInformationMessage should be called');
  });
});