import * as vscode from 'vscode';
import { CodeBlockParser } from './codeBlockParser';

export class ClipboardProcessor {
    public static async processClipboardContent(): Promise<void> {
        try {
            const content = await vscode.env.clipboard.readText();
            const parsedBlocks = CodeBlockParser.parseContent(content);
            
            // Log the parsed results
            console.log('Parsed Code Blocks:', JSON.stringify(parsedBlocks, null, 2));
            
            return Promise.resolve();
        } catch (error) {
            console.error('Error processing clipboard:', error);
            return Promise.reject(error);
        }
    }
}