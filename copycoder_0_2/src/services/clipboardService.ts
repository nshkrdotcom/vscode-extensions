import * as vscode from 'vscode';
import { FileContent } from './fileService';

export class ClipboardService {
  async copyToClipboard(content: string): Promise<void> {
    await vscode.env.clipboard.writeText(content);
  }

  async readFromClipboard(): Promise<string> {
    return await vscode.env.clipboard.readText();
  }

  formatFilesForClipboard(files: FileContent[]): string {
    return files.map(file => `=== ${file.path} ===\n${file.content}\n`).join('\n');
  }
}