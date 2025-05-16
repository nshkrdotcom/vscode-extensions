// src/test/suite/handlers/clipboardCommandHandler.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import { ClipboardCommandHandler } from '../../../handlers/clipboardCommandHandler';
import { ClipboardService } from '../../../services/clipboardService';
import { CodeBlockParserService } from '../../../services/codeBlockParserService';
import { MessageService } from '../../../services/messageService';

suite('ClipboardCommandHandler Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let clipboardService: sinon.SinonStubbedInstance<ClipboardService>;
  let parserService: sinon.SinonStubbedInstance<CodeBlockParserService>;
  let handler: ClipboardCommandHandler;
  let showInfoStub: sinon.SinonStub;
  let showErrorStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();
    clipboardService = sinon.createStubInstance(ClipboardService);
    parserService = sinon.createStubInstance(CodeBlockParserService);
    handler = new ClipboardCommandHandler(clipboardService, parserService);
    showInfoStub = sandbox.stub(MessageService, 'showInfo');
    showErrorStub = sandbox.stub(MessageService, 'showError');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should handle empty clipboard', async () => {
    clipboardService.readFromClipboard.resolves('');
    await handler.parseClipboard();
    assert.strictEqual(showInfoStub.calledWith('Clipboard is empty'), true);
    assert.strictEqual(parserService.parseContent.called, false);
  });

  test('should handle no valid code blocks', async () => {
    clipboardService.readFromClipboard.resolves('invalid content');
    parserService.parseContent.returns([]);
    await handler.parseClipboard();
    assert.strictEqual(showInfoStub.calledWith('No valid code blocks found in clipboard'), true);
  });

  test('should parse valid code blocks', async () => {
    clipboardService.readFromClipboard.resolves('=== src/app.js ===\n```\nconsole.log("test");\n```\n');
    parserService.parseContent.returns([
      { path: 'src/app.js', filename: 'app.js', extension: 'js', code: 'console.log("test");' },
    ]);
    await handler.parseClipboard();
    assert.strictEqual(showInfoStub.calledWith('Parsed 1 code blocks from clipboard'), true);
  });

  test('should handle errors', async () => {
    clipboardService.readFromClipboard.rejects(new Error('Test error'));
    await handler.parseClipboard();
    assert.strictEqual(showErrorStub.calledWith('Failed to parse clipboard: Error: Test error'), true);
  });
});