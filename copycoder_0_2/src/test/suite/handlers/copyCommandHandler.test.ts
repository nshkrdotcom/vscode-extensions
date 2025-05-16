// src/test/suite/handlers/copyCommandHandler.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CopyCommandHandler } from '../../../handlers/copyCommandHandler';
import { FileService } from '../../../services/fileService';
import { ClipboardService } from '../../../services/clipboardService';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { MessageService } from '../../../services/messageService';

suite('CopyCommandHandler Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let fileService: sinon.SinonStubbedInstance<FileService>;
  let clipboardService: sinon.SinonStubbedInstance<ClipboardService>;
  let configService: sinon.SinonStubbedInstance<GlobalConfigService>;
  let handler: CopyCommandHandler;
  let showInfoStub: sinon.SinonStub;
  let showErrorStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();
    fileService = sinon.createStubInstance(FileService);
    clipboardService = sinon.createStubInstance(ClipboardService);
    configService = sinon.createStubInstance(GlobalConfigService);
    // Mock the fs property as an object
    (configService as any).fs = {
      existsSync: sinon.stub(),
      mkdirSync: sinon.stub(),
      readFileSync: sinon.stub(),
      writeFileSync: sinon.stub(),
    };
    handler = new CopyCommandHandler(fileService, clipboardService, configService);
    showInfoStub = sandbox.stub(MessageService, 'showInfo');
    showErrorStub = sandbox.stub(MessageService, 'showError');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should handle no workspace folders', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);
    await handler.copyFiles();
    assert.strictEqual(showErrorStub.calledWith('No workspace folders open'), true);
    assert.strictEqual(fileService.scanWorkspaceFiles.called, false);
  });

  test('should handle no matching files', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: { fsPath: '/test' } }]);
    configService.getConfig.returns({
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
    });
    fileService.scanWorkspaceFiles.resolves({ files: [], hasGitignore: false });
    await handler.copyFiles();
    assert.strictEqual(showInfoStub.calledWith('No files matched the configuration'), true);
    assert.strictEqual(clipboardService.copyToClipboard.called, false);
  });

  test('should copy files to clipboard', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: { fsPath: '/test' } }]);
    configService.getConfig.returns({
      includeGlobalExtensions: true,
      applyGlobalBlacklist: true,
      filterUsingGitignore: true,
      projectExtensions: { javascript: ['.js'] },
      globalExtensions: ['.md'],
      projectBlacklist: {},
      globalBlacklist: [],
      enabledProjectTypes: ['javascript'],
      customExtensions: [],
      customBlacklist: [],
    });
    fileService.scanWorkspaceFiles.resolves({
      files: [{ path: 'src/app.js', content: 'console.log("test");' }],
      hasGitignore: false,
    });
    clipboardService.formatFilesForClipboard.returns('=== src/app.js ===\nconsole.log("test");\n');
    await handler.copyFiles();
    assert.strictEqual(clipboardService.copyToClipboard.calledWith('=== src/app.js ===\nconsole.log("test");\n'), true);
    assert.strictEqual(showInfoStub.calledWith('Copied 1 files to clipboard'), true);
  });

  test('should handle errors', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: { fsPath: '/test' } }]);
    configService.getConfig.throws(new Error('Test error'));
    await handler.copyFiles();
    assert.strictEqual(showErrorStub.calledWith('Failed to copy files: Error: Test error'), true);
  });
});