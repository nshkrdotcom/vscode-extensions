import * as vscode from 'vscode';

export class MessageService {
    static showInfo(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    static showError(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    static async promptInput(title: string, placeHolder: string): Promise<string | undefined> {
        return await vscode.window.showInputBox({
            title,
            placeHolder,
            prompt: placeHolder
        });
    }
}