// src/test/suite/handlers/configCommandHandler.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ConfigCommandHandler } from '../../../handlers/configCommandHandler';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { ConfigTreeItem } from '../../../ui/configTreeDataProvider';

suite('ConfigCommandHandler Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let configService: sinon.SinonStubbedInstance<GlobalConfigService>;
  let treeProvider: { refresh: sinon.SinonSpy };
  let handler: ConfigCommandHandler;
  let showInputBoxStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let executeCommandStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();
    configService = sinon.createStubInstance(GlobalConfigService);
    treeProvider = { refresh: sandbox.spy() };
    handler = new ConfigCommandHandler(configService, treeProvider);
    showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox').resolves();
    showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
    // Stub the refresh command to call treeProvider.refresh
    executeCommandStub.withArgs('copycoder.refreshConfigTree').callsFake(() => {
      treeProvider.refresh();
      return Promise.resolve();
    });
    // Allow other commands to resolve normally
    executeCommandStub.resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should toggle includeGlobalExtensions and refresh tree', async () => {
    const initialConfig = {
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {},
      globalExtensions: [],
      projectBlacklist: {},
      globalBlacklist: [],
      enabledProjectTypes: [],
      customExtensions: [],
      customBlacklist: [],
    };
    configService.getConfig.returns({ ...initialConfig });
    showInformationMessageStub.resolves(undefined); // Mock info message

    const item = new ConfigTreeItem(
      'Include Global Extensions',
      vscode.TreeItemCollapsibleState.None,
      'general-includeGlobalExtensions',
      'Enabled'
    );

    await handler.handleConfigTreeItem(item);

    assert.strictEqual(configService.saveConfig.calledOnce, true, 'saveConfig should be called once');
    assert.strictEqual(
      configService.saveConfig.args[0][0].includeGlobalExtensions,
      false,
      'includeGlobalExtensions should be toggled to false'
    );
    assert.strictEqual(
      showInformationMessageStub.calledWith('Include Global Extensions: Disabled'),
      true,
      'should show correct info message'
    );
    assert.strictEqual(
      executeCommandStub.calledWith('copycoder.refreshConfigTree'),
      true,
      'should execute refresh command'
    );
    assert.strictEqual(treeProvider.refresh.calledOnce, true, 'treeProvider.refresh should be called');
  });

  test('should remove global extension with confirmation', async () => {
    const initialConfig = {
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: {},
      globalExtensions: ['.md'],
      projectBlacklist: {},
      globalBlacklist: [],
      enabledProjectTypes: [],
      customExtensions: [],
      customBlacklist: [],
    };
    configService.getConfig.returns({ ...initialConfig });
    showInformationMessageStub.onCall(0).resolves('Yes'); // Mock confirmation
    showInformationMessageStub.onCall(1).resolves(undefined); // Mock info message

    const item = new ConfigTreeItem(
      '.md',
      vscode.TreeItemCollapsibleState.None,
      'extensions-global',
      '.md',
      'Global Extensions',
      'global'
    );

    await handler.handleConfigTreeItem(item);

    assert.strictEqual(configService.saveConfig.calledOnce, true, 'saveConfig should be called once');
    assert.deepStrictEqual(
      configService.saveConfig.args[0][0].globalExtensions,
      [],
      'globalExtensions should be empty'
    );
    assert.strictEqual(
      showInformationMessageStub.calledWith('Removed extension: .md (global)'),
      true,
      'should show correct info message'
    );
    assert.strictEqual(
      executeCommandStub.calledWith('copycoder.refreshConfigTree'),
      true,
      'should execute refresh command'
    );
    assert.strictEqual(treeProvider.refresh.calledOnce, true, 'treeProvider.refresh should be called');
  });

  test('should add project extension', async () => {
    const initialConfig = {
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: { python: ['.py'] },
      globalExtensions: [],
      projectBlacklist: {},
      globalBlacklist: [],
      enabledProjectTypes: ['python'],
      customExtensions: [],
      customBlacklist: [],
    };
    configService.getConfig.returns({ ...initialConfig });
    showInputBoxStub.resolves('.pyi'); // Mock input
    showInformationMessageStub.resolves(undefined); // Mock info message

    const item = new ConfigTreeItem(
      'Add Extension',
      vscode.TreeItemCollapsibleState.None,
      'add-project-extension',
      undefined,
      'python',
      'python'
    );

    await handler.handleConfigTreeItem(item);

    assert.strictEqual(configService.saveConfig.calledOnce, true, 'saveConfig should be called once');
    assert.deepStrictEqual(
      configService.saveConfig.args[0][0].projectExtensions.python,
      ['.py', '.pyi'],
      'projectExtensions.python should include .pyi'
    );
    assert.strictEqual(
      showInformationMessageStub.calledWith('Added extension: .pyi (python)'),
      true,
      'should show correct info message'
    );
    assert.strictEqual(
      executeCommandStub.calledWith('copycoder.refreshConfigTree'),
      true,
      'should execute refresh command'
    );
    assert.strictEqual(treeProvider.refresh.calledOnce, true, 'treeProvider.refresh should be called');
  });
});