import * as vscode from 'vscode';
import { NodeFileSystem } from './services/nodeFileSystem';
import { GlobalConfigService } from './services/globalConfigService';
import { FileService } from './services/fileService';
import { ClipboardService } from './services/clipboardService';
import { ConfigTreeDataProvider } from './ui/configTreeDataProvider';
import { CopyCommandHandler } from './handlers/copyCommandHandler';
import { ConfigCommandHandler } from './handlers/configCommandHandler';
import { ExtensionCommandHandler } from './handlers/extensionCommandHandler';
import { ClipboardCommandHandler } from './handlers/clipboardCommandHandler';
import { CodeBlockParserService } from './services/codeBlockParserService';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension activated');

  const fileSystem = new NodeFileSystem();
  const globalConfigService = new GlobalConfigService(fileSystem);

  const configTreeProvider = new ConfigTreeDataProvider(globalConfigService);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('copyCoderConfig', configTreeProvider)
  );

  const fileService = new FileService(fileSystem);
  const clipboardService = new ClipboardService();
  const parserService = new CodeBlockParserService();
  const copyCommandHandler = new CopyCommandHandler(fileService, clipboardService, globalConfigService);
  const configCommandHandler = new ConfigCommandHandler(globalConfigService, configTreeProvider);
  const extensionCommandHandler = new ExtensionCommandHandler();
  const clipboardCommandHandler = new ClipboardCommandHandler(clipboardService, parserService);

  context.subscriptions.push(
    vscode.commands.registerCommand('copycoder.copyFiles', () => copyCommandHandler.copyFiles()),
    vscode.commands.registerCommand('copycoder.copyOpenFiles', () => copyCommandHandler.copyOpenFiles()),
    vscode.commands.registerCommand('copycoder.helloWorld', () => extensionCommandHandler.helloWorld()),
    vscode.commands.registerCommand('copycoder.parseClipboard', () => clipboardCommandHandler.parseClipboard()),
    vscode.commands.registerCommand('copycoder.handleConfigTreeItem', (item) => configCommandHandler.handleConfigTreeItem(item))
  );
}

export function deactivate() {}