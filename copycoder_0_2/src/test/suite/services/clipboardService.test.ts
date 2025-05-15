// src/test/suite/services/clipboardService.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import { ClipboardService } from '../../../services/clipboardService';

suite('ClipboardService Tests', () => {
    let clipboardService: ClipboardService;
    let sandbox: sinon.SinonSandbox;
    let fakeClipboard: { writeText: sinon.SinonStub; readText: sinon.SinonStub };

    setup(() => {
        sandbox = sinon.createSandbox();
        // Create a fake clipboard object
        fakeClipboard = {
            writeText: sandbox.stub().resolves(),
            readText: sandbox.stub().resolves('')
        };
        clipboardService = new ClipboardService(fakeClipboard as any);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should write content to clipboard', async () => {
        const content = 'test content';
        await clipboardService.copyToClipboard(content);
        assert.strictEqual(fakeClipboard.writeText.calledWith(content), true, 'should write content to clipboard');
    });

    test('should read content from clipboard', async () => {
        const content = 'test content';
        fakeClipboard.readText.resolves(content);
        const result = await clipboardService.readFromClipboard();
        assert.strictEqual(result, content, 'should read content from clipboard');
        assert.strictEqual(fakeClipboard.readText.calledOnce, true, 'should call readText once');
    });

    test('should format files for clipboard', () => {
        const files = [
            { path: 'src/app.js', content: 'console.log("Hello");' },
            { path: 'README.md', content: '# Project' }
        ];
        const result = clipboardService.formatFilesForClipboard(files);
        const expected = '=== src/app.js ===\nconsole.log("Hello");\n\n=== README.md ===\n# Project\n';
        assert.strictEqual(result, expected, 'should format files correctly');
    });
});