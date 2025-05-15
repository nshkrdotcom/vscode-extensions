import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { MessageService } from '../../../services/messageService';

suite('MessageService Tests', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should show info message', () => {
        const spy = sandbox.spy(vscode.window, 'showInformationMessage');
        MessageService.showInfo('Test message');
        assert.strictEqual(spy.calledOnceWith('Test message'), true, 'Should show info message');
    });

    test('should show error message', () => {
        const spy = sandbox.spy(vscode.window, 'showErrorMessage');
        MessageService.showError('Error message');
        assert.strictEqual(spy.calledOnceWith('Error message'), true, 'Should show error message');
    });

    test('should prompt input and return value', async () => {
        const stub = sandbox.stub(vscode.window, 'showInputBox').resolves('test input');
        const result = await MessageService.promptInput('Test Title', 'Test Placeholder');
        assert.strictEqual(result, 'test input', 'Should return input value');
        assert.strictEqual(stub.calledOnceWith({
            title: 'Test Title',
            placeHolder: 'Test Placeholder',
            prompt: 'Test Placeholder'
        }), true, 'Should call showInputBox with correct options');
    });

    test('should handle undefined input prompt', async () => {
        const stub = sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
        const result = await MessageService.promptInput('Test Title', 'Test Placeholder');
        assert.strictEqual(result, undefined, 'Should return undefined for no input');
    });
});