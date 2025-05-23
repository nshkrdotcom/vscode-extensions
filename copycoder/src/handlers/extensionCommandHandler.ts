// src/handlers/extensionCommandHandler.ts
import { MessageService } from '../services/messageService';

export class ExtensionCommandHandler {
  async helloWorld(): Promise<void> {
    MessageService.showInfo('Hello from CopyCoder! Thanks for using our extension.');
  }
}