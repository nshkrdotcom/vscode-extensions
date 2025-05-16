// src/handlers/copyCommandHandler.ts
import * as vscode from 'vscode';
import { FileService } from '../services/fileService';
import { ClipboardService } from '../services/clipboardService';
import { GlobalConfigService } from '../services/globalConfigService';
import { MessageService } from '../services/messageService';

export class CopyCommandHandler {
  constructor(
    private fileService: FileService,
    private clipboardService: ClipboardService,
    private configService: GlobalConfigService // Updated type
  ) {}

  async copyFiles(): Promise<void> {
    try {
      const config = this.configService.getConfig();
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      if (workspaceFolders.length === 0) {
        MessageService.showError('No workspace folders open');
        return;
      }
      const result = await this.fileService.scanWorkspaceFiles(workspaceFolders, config);
      if (result.files.length === 0) {
        MessageService.showInfo('No files matched the configuration');
        return;
      }
      const formatted = this.clipboardService.formatFilesForClipboard(result.files);
      await this.clipboardService.copyToClipboard(formatted);
      MessageService.showInfo(`Copied ${result.files.length} files to clipboard`);
    } catch (error) {
      MessageService.showError(`Failed to copy files: ${error}`);
    }
  }
}