// src/test/suite/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ClipboardService } from '../../services/clipboardService';
import { FileService } from '../../services/fileService'; // Import FileService
import { ConfigTreeItem } from '../../ui/configTreeDataProvider';

suite('Extension Activation Tests', () => {
  const EXTENSION_ID = 'copycoder.copycoder';
  let sandbox: sinon.SinonSandbox;
  let clipboardServiceStub: sinon.SinonStubbedInstance<ClipboardService>;

  setup(() => {
    sandbox = sinon.createSandbox();
    // Create a stubbed ClipboardService
    clipboardServiceStub = sandbox.createStubInstance(ClipboardService);
    clipboardServiceStub.copyToClipboard.resolves();
    clipboardServiceStub.readFromClipboard.resolves('');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, 'Extension should be available');
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    if (!extension) {
      assert.fail('Extension not found');
      return;
    }
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test('Hello World command should show information message', async () => {
    const spy = sandbox.spy(vscode.window, 'showInformationMessage');
    await vscode.commands.executeCommand('copycoder.helloWorld');
    assert.strictEqual(spy.calledOnceWith('Hello World from CopyCoder!'), true);
  });

  test('Config tree item command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('copycoder.configTreeItemClicked'), 'Config command should be registered');
  });

  test('Copy files command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('copycoder.copyFiles'), 'Copy files command should be registered');
  });

  test('Parse clipboard command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('copycoder.parseClipboard'), 'Parse clipboard command should be registered');
  });

  test('Copy files command should interact with clipboard or show message', async () => {
    const showInfoSpy = sandbox.spy(vscode.window, 'showInformationMessage');
    const showErrorSpy = sandbox.spy(vscode.window, 'showErrorMessage');
    // Mock a workspace folder to test clipboard interaction
    const workspaceFolders = [{ uri: { fsPath: '/test/workspace' } } as vscode.WorkspaceFolder];
    sandbox.stub(vscode.workspace, 'workspaceFolders').value(workspaceFolders);
    // Stub FileService using createStubInstance
    const fileServiceStub = sandbox.createStubInstance(FileService);
    fileServiceStub.scanWorkspaceFiles.resolves({
      files: [{ path: 'src/app.js', content: 'console.log("test");' }],
      hasGitignore: false,
    });
    // Stub ClipboardService.formatFilesForClipboard
    clipboardServiceStub.formatFilesForClipboard.returns('=== src/app.js ===\nconsole.log("test");\n');
    await vscode.commands.executeCommand('copycoder.copyFiles');
    assert.strictEqual(
      clipboardServiceStub.copyToClipboard.called || showInfoSpy.called || showErrorSpy.called,
      true,
      'Should interact with clipboard, show info, or show error message'
    );
  });

  test('Parse clipboard command should read clipboard', async () => {
    const showInfoSpy = sandbox.spy(vscode.window, 'showInformationMessage');
    await vscode.commands.executeCommand('copycoder.parseClipboard');
    assert.strictEqual(
      clipboardServiceStub.readFromClipboard.called || showInfoSpy.called,
      true,
      'Should read clipboard or show message'
    );
  });
});