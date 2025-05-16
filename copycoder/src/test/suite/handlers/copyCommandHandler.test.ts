import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CopyCommandHandler } from '../../../handlers/copyCommandHandler';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { FileService } from '../../../services/fileService';
import { ClipboardService } from '../../../services/clipboardService';
import { MockFileSystem } from '../mockFileSystem'; // Import MockFileSystem
import { Config } from '../../../models/config';

suite('CopyCommandHandler Tests', () => {
  let configService: GlobalConfigService;
  let fileService: FileService;
  let clipboardService: ClipboardService;
  let handler: CopyCommandHandler;

  setup(() => {
    const fileSystem = new MockFileSystem(); // Use MockFileSystem
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
    // Create a simplified editor stub
    const editorStub = {
      document: {
        uri: { 
          fsPath: 'test.js',
          toString: () => 'file:///test.js',
          scheme: 'file'
        },
        fileName: 'test.js',
        getText: () => 'console.log("Hello");'
      }
    };
    
    // Simple approach: disable tab groups API for tests
    // This forces our code to fall back to visibleTextEditors which is easier to mock
    sinon.stub(vscode.window, 'tabGroups').value(undefined);
    
    // Mock visible editors with our stub
    sinon.stub(vscode.window, 'visibleTextEditors').value([editorStub]);
    
    // Also stub workspace.asRelativePath which is used by our function
    const asRelativePathStub = sinon.stub();
    asRelativePathStub.returns('test.js');
    sinon.stub(vscode.workspace, 'asRelativePath').callsFake(asRelativePathStub);
    
    // Set up the clipboard spy
    const clipboardSpy = sinon.spy(clipboardService, 'copyToClipboard');

    await handler.copyOpenFiles();

    assert.ok(clipboardSpy.calledOnce);
    assert.ok((vscode.window.showInformationMessage as sinon.SinonStub).calledWith('Copied content of 1 open files.'));
  });
});