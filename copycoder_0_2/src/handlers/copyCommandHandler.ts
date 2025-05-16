import { FileService, FileContent } from '../services/fileService';
import { ClipboardService } from '../services/clipboardService';
import { GlobalConfigService } from '../services/globalConfigService';
import { MessageService } from '../services/messageService';
import * as vscode from 'vscode';

export class CopyCommandHandler {
  constructor(
    private readonly fileService: FileService,
    private readonly clipboardService: ClipboardService,
    private readonly globalConfigService: GlobalConfigService
  ) {}

  async copyFiles(): Promise<void> {
    try {
      if (!vscode.workspace.workspaceFolders) {
        MessageService.showInfo('No workspace open to copy files from.');
        return;
      }
      const config = this.globalConfigService.getConfig();
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const files = await this.fileService.scanWorkspaceFiles(config, workspaceRoot);
      if (files.length === 0) {
        MessageService.showInfo('No files matched the current filters.');
        return;
      }
      const formatted = this.clipboardService.formatFilesForClipboard(files);
      await this.clipboardService.copyToClipboard(formatted);
      MessageService.showInfo(`Copied ${files.length} project files to clipboard.`);
    } catch (error) {
      MessageService.showError(`Failed to copy project files: ${error}`);
    }
  }

  async copyOpenFiles(): Promise<void> {
    try {
      // Get files from all sources to ensure we capture everything
      const allTabs: vscode.Tab[] = [];
      
      // Get all tabs from all tab groups (if available)
      // Use try-catch to handle when tabs API isn't available (especially in tests)
      try {
        if (vscode.window.tabGroups) {
          vscode.window.tabGroups.all.forEach(group => {
            group.tabs.forEach(tab => {
              allTabs.push(tab);
            });
          });
        }
      } catch (e) {
        console.log('Tab groups API not available, falling back to editors');
      }
      
      // Use visible editors as fallback for testing
      const visibleEditors = vscode.window.visibleTextEditors;
      const allDocuments = vscode.workspace.textDocuments;
      
      console.log(`CopyCommandHandler.copyOpenFiles - Found ${allTabs.length} tabs, ${visibleEditors.length} visible editors, and ${allDocuments.length} open documents`);
      
      // Collect files from all sources, avoiding duplicates
      const filesToCopy: FileContent[] = [];
      const processedPaths = new Set<string>();
      
      // First try to collect from tabs (most reliable for actual open tabs)
      if (allTabs.length > 0) {
        for (const tab of allTabs) {
          try {
            // Skip non-text tabs
            if (!(tab.input instanceof vscode.TabInputText)) {
              continue;
            }
            
            const uri = tab.input.uri;
            const document = await vscode.workspace.openTextDocument(uri);
            let path = "unknown";
            
            try {
              path = vscode.workspace.asRelativePath(uri, false);
            } catch (e) {
              path = uri.toString();
            }
            
            console.log(`CopyCommandHandler.copyOpenFiles - Processing tab with path: ${path}`);
            
            // Add to our collection if not already processed
            if (!processedPaths.has(path)) {
              processedPaths.add(path);
              filesToCopy.push({
                path,
                content: document.getText()
              });
            }
          } catch (e) {
            console.error(`Error processing tab: ${e}`);
          }
        }
      }
      
      // If no files collected from tabs, try visible editors (especially for tests)
      if (filesToCopy.length === 0 && visibleEditors.length > 0) {
        for (const editor of visibleEditors) {
          try {
            let path = "unknown";
            
            if (editor.document.uri) {
              try {
                path = vscode.workspace.asRelativePath(editor.document.uri, false);
              } catch (e) {
                path = editor.document.uri.toString();
              }
            } else if (editor.document.fileName) {
              path = editor.document.fileName;
            }
            
            console.log(`CopyCommandHandler.copyOpenFiles - Processing editor with path: ${path}`);
            
            // Add to our collection if not already processed
            if (!processedPaths.has(path)) {
              processedPaths.add(path);
              filesToCopy.push({
                path,
                content: editor.document.getText()
              });
            }
          } catch (e) {
            console.error(`Error processing editor: ${e}`);
          }
        }
      }
      
      // If still no files, try all text documents as last resort
      if (filesToCopy.length === 0) {
        for (const document of allDocuments) {
          try {
            // Skip non-file documents (SCM inputs, git diffs, etc)
            if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
              console.log(`Skipping document with scheme: ${document.uri.scheme}`);
              continue;
            }
            
            let path = "unknown";
            
            if (document.uri) {
              try {
                path = vscode.workspace.asRelativePath(document.uri, false);
              } catch (e) {
                path = document.uri.toString();
              }
            } else if (document.fileName) {
              path = document.fileName;
            }
            
            console.log(`CopyCommandHandler.copyOpenFiles - Processing document with path: ${path}`);
            
            // Add to our collection if not already processed
            if (!processedPaths.has(path)) {
              processedPaths.add(path);
              filesToCopy.push({
                path,
                content: document.getText()
              });
            }
          } catch (e) {
            console.error(`Error processing document: ${e}`);
          }
        }
      }
      
      console.log(`CopyCommandHandler.copyOpenFiles - Collected ${filesToCopy.length} files to copy`);
      
      // Debug each file being collected
      filesToCopy.forEach((file, i) => {
        console.log(`CopyCommandHandler.copyOpenFiles - File [${i}]: ${file.path}, length: ${file.content.length}`);
      });
      
      if (filesToCopy.length === 0) {
        MessageService.showInfo('No open files to copy.');
        return;
      }
      
      const formatted = this.clipboardService.formatFilesForClipboard(filesToCopy);
      
      // Debug the formatted output
      console.log(`CopyCommandHandler.copyOpenFiles - Formatted output length: ${formatted.length}`);
      const detectedSeparators = (formatted.match(/^=== .+ ===$/gm) || []);
      console.log(`CopyCommandHandler.copyOpenFiles - Detected ${detectedSeparators.length} file separators in output`);
      detectedSeparators.forEach((separator, i) => {
        console.log(`CopyCommandHandler.copyOpenFiles - Separator [${i}]: ${separator}`);
      });
      
      await this.clipboardService.copyToClipboard(formatted);
      
      // Focus the current active editor to ensure VS Code maintains UI state
      if (vscode.window.activeTextEditor) {
        vscode.window.showTextDocument(vscode.window.activeTextEditor.document);
      }
      
      MessageService.showInfo(`Copied content of ${filesToCopy.length} open files.`);
    } catch (error) {
      console.error(`Error in copyOpenFiles: ${error}`);
      MessageService.showError(`Failed to copy open files: ${error}`);
    }
  }
}