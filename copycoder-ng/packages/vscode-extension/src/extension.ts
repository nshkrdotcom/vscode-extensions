/**
 * @copycoder/vscode-extension Entry Point
 */
import * as vscode from 'vscode';
import { processProject } from '@copycoder/core'; // Import from the core package

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 */
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "@copycoder/vscode-extension" is now active!');

    // Example command registration
    const disposable = vscode.commands.registerCommand('copycoder-ng.copyProject', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        // For simplicity, use the first workspace folder
        const rootPath = workspaceFolders[0].uri.fsPath;

        vscode.window.showInformationMessage(`Copy Coder NG: Processing project at ${rootPath}...`);

        try {
            // Call the core logic
            const result = await processProject(
                { path: rootPath }, // Basic source config
                { format: 'string' } // Basic output config
            );

            // Copy result to clipboard
            await vscode.env.clipboard.writeText(result.content);

            vscode.window.showInformationMessage(
                `Copy Coder NG: Copied content from ${result.filesProcessed} file(s) to clipboard.`
            );

            if (result.warnings.length > 0) {
                vscode.window.showWarningMessage(`Copy Coder NG: Encountered warnings: ${result.warnings.join(', ')}`);
            }

        } catch (error) {
            console.error('Copy Coder NG Error:', error);
            vscode.window.showErrorMessage(`Copy Coder NG failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {
    console.log('Extension "@copycoder/vscode-extension" is deactivated.');
}