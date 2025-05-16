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
      console.log(`ClipboardService.formatFilesForClipboard - File [${i}]: ${files[i].path}, content length: ${files[i].content.length}, content preview: ${files[i].content.substring(0, Math.min(20, files[i].content.length))}...`);
    }
    
    // Check if we actually have files to format
    if (files.length === 0) {
      console.log(`ClipboardService.formatFilesForClipboard - No files to format, returning empty string`);
      return '';
    }
    
    // Use a debugging array to track what gets added
    const formattedParts: string[] = [];
    
    // Format to match the expected test output format (no extra leading newlines)
    files.forEach((file, i) => {
      // First file doesn't need a preceding newline
      const separator = `=== ${file.path} ===`;
      const part = `${i === 0 ? '' : '\n'}${separator}\n${file.content}`;
      formattedParts.push(part);
      console.log(`ClipboardService.formatFilesForClipboard - Added part ${i}, separator: ${separator}, length: ${part.length}`);
    });
    
    // Join all parts and add trailing newline
    const formattedOutput = formattedParts.join('\n');
    const finalOutput = formattedOutput + '\n';
    
    console.log(`ClipboardService.formatFilesForClipboard - Final formatted output length: ${finalOutput.length}`);
    console.log(`ClipboardService.formatFilesForClipboard - Number of file separators in output: ${(finalOutput.match(/^=== .+ ===$/gm) || []).length}`);
    
    // Final validation check
    if (files.length > 0 && (finalOutput.match(/^=== .+ ===$/gm) || []).length !== files.length) {
      console.error(`ClipboardService.formatFilesForClipboard - WARNING: Separator count (${(finalOutput.match(/^=== .+ ===$/gm) || []).length}) doesn't match file count (${files.length})`);
    }
    
    return finalOutput;
  }
}