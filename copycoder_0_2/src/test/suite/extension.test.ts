// src/test/suite/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

suite('Extension Activation Tests', () => {
    const EXTENSION_ID = 'copycoder.copycoder';

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

    test('Hello World command should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('copycoder.helloWorld'), 'Command should be registered');
    });

    test('Hello World command should show information message', async () => {
        // Create a spy on the showInformationMessage method
        const spy = sinon.spy(vscode.window, 'showInformationMessage');
        
        // Execute the command
        await vscode.commands.executeCommand('copycoder.helloWorld');
        
        // Verify that showInformationMessage was called with the expected message
        assert.strictEqual(spy.calledOnce, true);
        assert.strictEqual(spy.calledWith('Hello World from CopyCoder!'), true);
        
        // Restore the original method
        spy.restore();
    });
});