// src/extension.ts
import * as vscode from 'vscode';
import { ConfigTreeDataProvider, ConfigTreeItem } from './ui/configTreeDataProvider';
import { GlobalConfigService } from './services/globalConfigService';
import { MessageService } from './services/messageService';
import { FileService } from './services/fileService';
import { ClipboardService } from './services/clipboardService';
import { CodeBlockParserService } from './services/codeBlockParserService';
import { NodeFileSystem } from './services/fileSystem';
import {
  ConfigCommandHandler,
  CopyCommandHandler,
  ClipboardCommandHandler,
  ExtensionCommandHandler,
} from './handlers';

export function activate(context: vscode.ExtensionContext) {
  const fileSystem = new NodeFileSystem();
  const configService = new GlobalConfigService(fileSystem);
  const fileService = new FileService();
  const clipboardService = new ClipboardService();
  const codeBlockParserService = new CodeBlockParserService();
  const configTreeProvider = new ConfigTreeDataProvider(configService);

  // Handlers
  const configHandler = new ConfigCommandHandler(configService, configTreeProvider);
  const copyHandler = new CopyCommandHandler(fileService, clipboardService, configService);
  const clipboardHandler = new ClipboardCommandHandler(clipboardService, codeBlockParserService);
  const extensionHandler = new ExtensionCommandHandler();

  // Register Tree Data Provider
  vscode.window.registerTreeDataProvider('copycoderConfig', configTreeProvider);

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('copycoder.helloWorld', () => extensionHandler.helloWorld()),
    vscode.commands.registerCommand('copycoder.configTreeItemClicked', (item: ConfigTreeItem) =>
      configHandler.handleConfigTreeItem(item)
    ),
    vscode.commands.registerCommand('copycoder.copyFiles', () => copyHandler.copyFiles()),
    vscode.commands.registerCommand('copycoder.parseClipboard', () => clipboardHandler.parseClipboard())
  );
}

export function deactivate() {}