// src/services/clipboardService.ts
import * as vscode from 'vscode';
import { ParsedCodeBlock } from '../models';

export class ClipboardService {
    private readonly clipboard: typeof vscode.env.clipboard;

    constructor(clipboard: typeof vscode.env.clipboard = vscode.env.clipboard) {
        this.clipboard = clipboard;
    }

    /**
     * Copy content to clipboard
     */
    public async copyToClipboard(content: string): Promise<void> {
        return this.clipboard.writeText(content);
    }

    /**
     * Read content from clipboard
     */
    public async readFromClipboard(): Promise<string> {
        return this.clipboard.readText();
    }

    /**
     * Format files for copying to clipboard
     */
    public formatFilesForClipboard(files: { path: string; content: string }[]): string {
        return files
            .map(file => `=== ${file.path} ===\n${file.content}\n`)
            .join('\n');
    }
}