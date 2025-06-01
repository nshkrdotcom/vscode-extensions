import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { ConfigTreeDataProvider } from '../../../ui/configTreeDataProvider';
import { ConfigCommandHandler } from '../../../handlers/configCommandHandler';
import { MockFileSystem } from '../mockFileSystem';

suite('ConfigCommandHandler Tests', () => {
  let globalConfigService: GlobalConfigService;
  let configTreeProvider: ConfigTreeDataProvider;
  let configCommandHandler: ConfigCommandHandler;

  setup(() => {
    const fileSystem = new MockFileSystem();
    globalConfigService = new GlobalConfigService(fileSystem);
    configTreeProvider = new ConfigTreeDataProvider(globalConfigService);
    configCommandHandler = new ConfigCommandHandler(globalConfigService, configTreeProvider);

    sinon.stub(vscode.window, 'showInformationMessage').resolves();
    sinon.stub(vscode.window, 'showWarningMessage').resolves();
    sinon.stub(vscode.window, 'showInputBox').resolves();
  });

  teardown(() => {
    sinon.restore();
  });

  test('toggleIncludeGlobalExtensions', async () => {
    const refreshSpy = sinon.stub(configTreeProvider, 'refresh');
    // const saveSpy = sinon.spy(globalConfigService, 'saveConfig');
    
    // Create initial state and stub updateConfig
    const updateConfigStub = sinon.stub(globalConfigService, 'updateConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Include Global Extensions',
      commandId: 'toggleIncludeGlobalExtensions',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'general-includeGlobalExtensions'
    });

    assert.ok(updateConfigStub.called, 'updateConfig should be called');
    assert.ok(refreshSpy.calledOnce, 'refresh should be called');
  });

  test('addGlobalExtension', async () => {
    (vscode.window.showInputBox as sinon.SinonStub).resolves('.new');
    const refreshSpy = sinon.stub(configTreeProvider, 'refresh');
    const updateConfigStub = sinon.stub(globalConfigService, 'updateConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Global Extension',
      commandId: 'addGlobalExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-global-extension'
    });

    assert.ok(updateConfigStub.called, 'updateConfig should be called');
    assert.ok(refreshSpy.calledOnce, 'refresh should be called');
  });
  
  test('addCustomExtension', async () => {
    (vscode.window.showInputBox as sinon.SinonStub).resolves('.custom');
    const refreshSpy = sinon.stub(configTreeProvider, 'refresh');
    const updateConfigStub = sinon.stub(globalConfigService, 'updateConfig');

    await configCommandHandler.handleConfigTreeItem({
      label: 'Add Extension',
      commandId: 'addCustomExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-project-extension:node'
    });

    assert.ok(updateConfigStub.called, 'updateConfig should be called');
    assert.ok(refreshSpy.calledOnce, 'refresh should be called');
  });
});