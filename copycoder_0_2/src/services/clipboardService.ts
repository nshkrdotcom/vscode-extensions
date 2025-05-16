import * as vscode from 'vscode';
import { FileContent } from './fileService';

export class ClipboardService {
  async copyToClipboard(content: string): Promise<void> {
    console.log(`ClipboardService.copyToClipboard - Writing content of length ${content.length} to clipboard`);
    // Let's add a check to see if the content actually contains multiple file separators
    const fileCount = (content.match(/^=== .+ ===$/gm) || []).length;
    console.log(`ClipboardService.copyToClipboard - Content appears to contain ${fileCount} file separators`);
    await vscode.env.clipboard.writeText(content);
  }

  async readFromClipboard(): Promise<string> {
    return await vscode.env.clipboard.readText();
  }

  formatFilesForClipboard(files: FileContent[]): string {
    console.log(`ClipboardService.formatFilesForClipboard - Formatting ${files.length} files for clipboard`);
    
    // Let's examine each file being processed
    for (let i = 0; i < files.length; i++) {
      console.log(`ClipboardService.formatFilesForClipboard - File [${i}]: ${files[i].path}, content length: ${files[i].content.length}`);
    }
    
    // Format to match the expected test output format (no extra leading newlines)
    const formattedOutput = files.map((file, i) => {
      // First file doesn't need a preceding newline
      return `${i === 0 ? '' : '\n'}=== ${file.path} ===\n${file.content}`;
    }).join('\n');
    
    // Add a trailing newline for test compatibility
    const finalOutput = formattedOutput + '\n';
    
    console.log(`ClipboardService.formatFilesForClipboard - Final formatted output length: ${finalOutput.length}`);
    console.log(`ClipboardService.formatFilesForClipboard - Number of file separators in output: ${(finalOutput.match(/^=== .+ ===$/gm) || []).length}`);
    
    return finalOutput;
  }
}