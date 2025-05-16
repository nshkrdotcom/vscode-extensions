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
  console.log('Debug: Registering view with ID copycoderConfig');

  const fileSystem = new NodeFileSystem();
  const globalConfigService = new GlobalConfigService(fileSystem);

  const configTreeProvider = new ConfigTreeDataProvider(globalConfigService);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('copycoderConfig', configTreeProvider)
  );

  const fileService = new FileService(fileSystem);
  const clipboardService = new ClipboardService();
  const parserService = new CodeBlockParserService();
  const copyCommandHandler = new CopyCommandHandler(fileService, clipboardService, globalConfigService);
  const configCommandHandler = new ConfigCommandHandler(globalConfigService, configTreeProvider);
  const extensionCommandHandler = new ExtensionCommandHandler();
  const clipboardCommandHandler = new ClipboardCommandHandler(clipboardService, parserService);

  console.log('Debug: Registering commands');
  context.subscriptions.push(
    vscode.commands.registerCommand('copycoder.copyFiles', () => {
      console.log('Debug: copycoder.copyFiles command called');
      return copyCommandHandler.copyFiles();
    }),
    vscode.commands.registerCommand('copycoder.copyOpenFiles', () => {
      console.log('Debug: copycoder.copyOpenFiles command called');
      return copyCommandHandler.copyOpenFiles();
    }),
    vscode.commands.registerCommand('copycoder.helloWorld', () => extensionCommandHandler.helloWorld()),
    vscode.commands.registerCommand('copycoder.parseClipboard', () => clipboardCommandHandler.parseClipboard()),
    vscode.commands.registerCommand('copycoder.configTreeItemClicked', (item) => {
      console.log('Debug: copycoder.configTreeItemClicked command called');
      return configCommandHandler.handleConfigTreeItem(item);
    })
  );
  
  // Keep the old command ID for backward compatibility
  context.subscriptions.push(
    vscode.commands.registerCommand('copycoder.handleConfigTreeItem', (item) => {
      console.log('Debug: copycoder.handleConfigTreeItem command called');
      return configCommandHandler.handleConfigTreeItem(item);
    })
  );
  
  // Try to register the commands from package.json as well to ensure compatibility
  console.log('Debug: Registering additional commands to match package.json');
  context.subscriptions.push(
    vscode.commands.registerCommand('copycoder.copyAllOpenFiles', () => {
      console.log('Debug: copycoder.copyAllOpenFiles command called');
      return copyCommandHandler.copyOpenFiles();
    }),
    vscode.commands.registerCommand('copycoder.copyAllProjectFiles', () => {
      console.log('Debug: copycoder.copyAllProjectFiles command called');
      return copyCommandHandler.copyFiles();
    })
  );
}

export function deactivate() {}