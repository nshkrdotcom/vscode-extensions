import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ConfigCommandHandler } from '../../../handlers/configCommandHandler';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../../../ui/configTreeDataProvider';
import { NodeFileSystem } from '../../../services/nodeFileSystem';
import { Config } from '../../../models/config';

suite('ConfigCommandHandler Tests', () => {
  let configService: GlobalConfigService;
  let treeDataProvider: ConfigTreeDataProvider;
  let handler: ConfigCommandHandler;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    const fileSystem = new NodeFileSystem();
    configService = new GlobalConfigService(fileSystem);
    treeDataProvider = new ConfigTreeDataProvider(configService);
    handler = new ConfigCommandHandler(configService, treeDataProvider);
    sandbox.stub(vscode.window, 'showInformationMessage');
    sandbox.stub(vscode.window, 'showErrorMessage');
    sandbox.stub(vscode.window, 'showWarningMessage');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('toggleIncludeGlobalExtensions', async () => {
    const initialConfig: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: [],
      globalExtensions: [],
      customExtensions: {},
      globalBlacklist: [],
      customBlacklist: {}
    };
    sandbox.stub(configService, 'getConfig').returns({ ...initialConfig });
    const saveSpy = sandbox.spy(configService, 'saveConfig');
    const refreshSpy = sandbox.spy(treeDataProvider, 'refresh');

    await handler.handleConfigTreeItem({
      label: 'Include Global Extensions',
      commandId: 'toggleIncludeGlobalExtensions',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'general-includeGlobalExtensions'
    });

    assert.ok(saveSpy.calledOnce);
    assert.ok(saveSpy.calledWithMatch({ includeGlobalExtensions: false }));
    assert.ok(refreshSpy.calledOnce);
  });

  test('addGlobalExtension', async () => {
    const initialConfig: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: [],
      globalExtensions: ['.js'],
      customExtensions: {},
      globalBlacklist: [],
      customBlacklist: {}
    };
    sandbox.stub(configService, 'getConfig').returns({ ...initialConfig });
    sandbox.stub(vscode.window, 'showInputBox').resolves('.ts');
    const saveSpy = sandbox.spy(configService, 'saveConfig');
    const refreshSpy = sandbox.spy(treeDataProvider, 'refresh');

    await handler.handleConfigTreeItem({
      label: 'Add Global Extension',
      commandId: 'addGlobalExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-global-extension'
    });

    assert.ok(saveSpy.calledOnce);
    assert.ok(saveSpy.calledWithMatch({ globalExtensions: ['.js', '.ts'] }));
    assert.ok(refreshSpy.calledOnce);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Global extension ".ts" added.'));
  });

  test('addCustomExtension', async () => {
    const initialConfig: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['python'],
      globalExtensions: [],
      customExtensions: { python: ['.py'] },
      globalBlacklist: [],
      customBlacklist: { python: [] }
    };
    sandbox.stub(configService, 'getConfig').returns({ ...initialConfig });
    sandbox.stub(vscode.window, 'showInputBox').resolves('.pyi');
    const saveSpy = sandbox.spy(configService, 'saveConfig');
    const refreshSpy = sandbox.spy(treeDataProvider, 'refresh');

    await handler.handleConfigTreeItem({
      label: 'Add Extension',
      commandId: 'addCustomExtension',
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: 'add-project-extension:python'
    });

    assert.ok(saveSpy.calledOnce);
    assert.ok(saveSpy.args[0][0].customExtensions.python.includes('.pyi'));
    assert.ok(refreshSpy.calledOnce);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Extension ".pyi" added for "python".'));
  });
});