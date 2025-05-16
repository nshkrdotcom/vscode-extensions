import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CopyCommandHandler } from '../../../handlers/copyCommandHandler';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { FileService } from '../../../services/fileService';
import { ClipboardService } from '../../../services/clipboardService';
import { NodeFileSystem } from '../../../services/nodeFileSystem';
import { Config } from '../../../models/config';

suite('CopyCommandHandler Tests', () => {
  let configService: GlobalConfigService;
  let fileService: FileService;
  let clipboardService: ClipboardService;
  let handler: CopyCommandHandler;

  setup(() => {
    const fileSystem = new NodeFileSystem();
    configService = new GlobalConfigService(fileSystem);
    fileService = new FileService(fileSystem);
    clipboardService = new ClipboardService();
    handler = new CopyCommandHandler(fileService, clipboardService, configService);
    sinon.stub(vscode.window, 'showInformationMessage');
    sinon.stub(vscode.window, 'showErrorMessage');
  });

  teardown(() => {
    sinon.restore();
  });

  test('copyFiles with valid workspace', async () => {
    const config: Config = {
      includeGlobalExtensions: true,
      filterUsingGitignore: true,
      projectTypes: ['node'],
      globalExtensions: ['.js'],
      customExtensions: { node: [] },
      globalBlacklist: ['node_modules'],
      customBlacklist: { node: [] }
    };
    sinon.stub(configService, 'getConfig').returns(config);
    sinon.stub(vscode.workspace, 'workspaceFolders').value([{ uri: { fsPath: '/workspace' } }]);
    sinon.stub(fileService, 'scanWorkspaceFiles').resolves([
      { path: 'index.js', content: 'console.log("Hello");' }
    ]);
    const clipboardSpy = sinon.spy(clipboardService, 'copyToClipboard');

    await handler.copyFiles();

    assert.ok(clipboardSpy.calledOnce);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Copied 1 project files to clipboard.'));
  });

  test('copyOpenFiles with open editors', async () => {
    const editorStub = {
      document: {
        uri: { fsPath: 'test.js' },
        getText: () => 'console.log("Hello");'
      }
    };
    sinon.stub(vscode.window, 'visibleTextEditors').value([editorStub]);
    const clipboardSpy = sinon.spy(clipboardService, 'copyToClipboard');

    await handler.copyOpenFiles();

    assert.ok(clipboardSpy.calledOnce);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Copied content of 1 open files.'));
  });
});