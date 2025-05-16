// src/handlers/clipboardCommandHandler.ts
import { ClipboardService } from '../services/clipboardService';
import { CodeBlockParserService } from '../services/codeBlockParserService';
import { MessageService } from '../services/messageService';

export class ClipboardCommandHandler {
  constructor(
    private clipboardService: ClipboardService,
    private parserService: CodeBlockParserService
  ) {}

  async parseClipboard(): Promise<void> {
    try {
      const content = await this.clipboardService.readFromClipboard();
      if (!content.trim()) {
        MessageService.showInfo('Clipboard is empty');
        return;
      }
      const blocks = this.parserService.parseContent(content);
      if (blocks.length === 0) {
        MessageService.showInfo('No valid code blocks found in clipboard');
        return;
      }
      // For now, just show the number of parsed blocks
      // Future: Could write blocks to files or display in UI
      MessageService.showInfo(`Parsed ${blocks.length} code blocks from clipboard`);
    } catch (error) {
      MessageService.showError(`Failed to parse clipboard: ${error}`);
    }
  }
}