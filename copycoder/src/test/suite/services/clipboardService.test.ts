import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ClipboardService } from '../../../services/clipboardService';

suite('ClipboardService Tests', () => {
  let clipboardService: ClipboardService;
  let sandbox: sinon.SinonSandbox;
  let mockClipboard: {
    writeText: sinon.SinonStub;
    readText: sinon.SinonStub;
  };

  setup(() => {
    sandbox = sinon.createSandbox();
    // Create a mock clipboard object
    mockClipboard = {
      writeText: sandbox.stub().resolves(),
      readText: sandbox.stub().resolves(''),
    };
    // Stub vscode.env.clipboard to return the mock
    sandbox.stub(vscode.env, 'clipboard').value(mockClipboard);
    clipboardService = new ClipboardService();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should write content to clipboard', async () => {
    const content = 'test content';
    mockClipboard.writeText.resolves();
    await clipboardService.copyToClipboard(content);
    assert.strictEqual(mockClipboard.writeText.calledWith(content), true, 'should call writeText with content');
  });

  test('should read content from clipboard', async () => {
    const content = 'test content';
    mockClipboard.readText.resolves(content);
    const result = await clipboardService.readFromClipboard();
    assert.strictEqual(result, content, 'should read content from clipboard');
    assert.strictEqual(mockClipboard.readText.calledOnce, true, 'should call readText once');
  });

  test('should format files for clipboard', () => {
    const files = [
      { path: 'src/app.js', content: 'console.log("Hello");' },
      { path: 'README.md', content: '# Project' },
    ];
    const result = clipboardService.formatFilesForClipboard(files);
    const expected = '=== src/app.js ===\nconsole.log("Hello");\n\n=== README.md ===\n# Project\n';
    assert.strictEqual(result, expected, 'should format files correctly');
  });
});