import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// Register the command that will be called when the extension is activated
	const disposable = vscode.commands.registerCommand('copycoder.helloWorld', () => {
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello from VS Code Extension!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
