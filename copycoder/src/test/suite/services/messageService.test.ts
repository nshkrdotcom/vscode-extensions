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

  test('should show info message', async () => {
    const stub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    await MessageService.showInfo('Test message');
    assert.ok(stub.calledWith('Test message'));
  });

  test('should show error message', async () => {
    const stub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    await MessageService.showError('Error message');
    assert.ok(stub.calledWith('Error message'));
  });

  test('should prompt input and return value', async () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves('input');
    const result = await MessageService.promptInput('Enter value', 'Enter value');
    assert.strictEqual(result, 'input');
  });

  test('should handle undefined input prompt', async () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
    const result = await MessageService.promptInput('Enter value', 'Enter value');
    assert.strictEqual(result, undefined);
  });
});