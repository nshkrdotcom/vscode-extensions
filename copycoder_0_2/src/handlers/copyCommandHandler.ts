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
      const openEditors = vscode.window.visibleTextEditors;
      if (openEditors.length === 0) {
        MessageService.showInfo('No open files to copy.');
        return;
      }
      const filesToCopy: FileContent[] = openEditors.map(editor => ({
        path: vscode.workspace.asRelativePath(editor.document.uri, false) || editor.document.uri.fsPath,
        content: editor.document.getText()
      }));
      const formatted = this.clipboardService.formatFilesForClipboard(filesToCopy);
      await this.clipboardService.copyToClipboard(formatted);
      MessageService.showInfo(`Copied content of ${filesToCopy.length} open files.`);
    } catch (error) {
      MessageService.showError(`Failed to copy open files: ${error}`);
    }
  }
}