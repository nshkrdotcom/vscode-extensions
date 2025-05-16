import * as vscode from 'vscode';

export class MessageService {
  static showInfo(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  static showError(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  static showWarning(message: string): void {
    vscode.window.showWarningMessage(message);
  }

    static async promptInput(title: string, placeHolder: string): Promise<string | undefined> {
        return await vscode.window.showInputBox({
            title,
            placeHolder,
            prompt: placeHolder
        });
    }

    static async prompt(message: string): Promise<string | undefined> {
        return await vscode.window.showInformationMessage(message, { modal: true }, 'Yes', 'No');
    }
}