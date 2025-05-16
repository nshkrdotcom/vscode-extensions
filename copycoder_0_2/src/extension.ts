import * as vscode from 'vscode';
import { NodeFileSystem } from './services/nodeFileSystem';
import { GlobalConfigService } from './services/globalConfigService';
import { FileService } from './services/fileService';
import { ClipboardService } from './services/clipboardService';
import { CodeBlockParserService } from './services/codeBlockParserService';
import { ConfigTreeDataProvider } from './ui/configTreeDataProvider';
import { ExtensionCommandHandler } from './handlers/extensionCommandHandler';
import { ConfigCommandHandler } from './handlers/configCommandHandler';
import { CopyCommandHandler } from './handlers/copyCommandHandler';
import { ClipboardCommandHandler } from './handlers/clipboardCommandHandler';
import { MessageService } from './services/messageService';
import { DEFAULT_CONFIG } from './models/config'; // Add this import

export function activate(context: vscode.ExtensionContext) {
  console.log('CopyCoder extension is activating...');

  // Instantiate services
  let globalConfigService: GlobalConfigService;
  try {
    const fileSystem = new NodeFileSystem();
    globalConfigService = new GlobalConfigService(fileSystem);
  } catch (error) {
    MessageService.showError(`Failed to initialize GlobalConfigService: ${error}`);
    console.error('GlobalConfigService initialization error:', error);
    globalConfigService = {
      getConfig: () => ({ ...DEFAULT_CONFIG }),
      saveConfig: () => {
        console.warn('GlobalConfigService.saveConfig unavailable due to initialization failure');
      }
    } as any;
  }

  const fileSystem = new NodeFileSystem();
  const fileService = new FileService(fileSystem);
  const clipboardService = new ClipboardService();
  const codeBlockParserService = new CodeBlockParserService();

  // Instantiate UI provider
  const configTreeProvider = new ConfigTreeDataProvider(globalConfigService);

  // Instantiate command handlers
  const extensionHandler = new ExtensionCommandHandler();
  const configHandler = new ConfigCommandHandler(globalConfigService, configTreeProvider);
  const copyCommandHandler = new CopyCommandHandler(fileService, clipboardService, globalConfigService);
  const clipboardHandler = new ClipboardCommandHandler(clipboardService, codeBlockParserService);

  // Register UI elements and commands
  try {
    registerAllUIElements(context, configTreeProvider);
    registerAllCommands(context, extensionHandler, configHandler, copyCommandHandler, clipboardHandler);
  } catch (error) {
    MessageService.showError(`Failed to register UI elements or commands: ${error}`);
    console.error('Registration error:', error);
  }

  // Perform initial setup
  try {
    performInitialSetup(context, globalConfigService, configTreeProvider);
    console.log('CopyCoder activated spectacle.');
  } catch (error) {
    MessageService.showError(`Failed to perform initial setup: ${error}`);
    console.error('Initial setup error:', error);
  }
}

function registerAllCommands(
  context: vscode.ExtensionContext,
  extensionHandler: ExtensionCommandHandler,
  configHandler: ConfigCommandHandler,
  copyCommandHandler: CopyCommandHandler,
  clipboardHandler: ClipboardCommandHandler
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('copycoder.helloWorld', () => extensionHandler.helloWorld()),
    vscode.commands.registerCommand('copycoder.configTreeItemClicked', (item: any) =>
      configHandler.handleConfigTreeItem(item)
    ),
    vscode.commands.registerCommand('copycoder.copyAllProjectFiles', () =>
      copyCommandHandler.copyFiles()
    ),
    vscode.commands.registerCommand('copycoder.copyAllOpenFiles', () =>
      copyCommandHandler.copyOpenFiles()
    ),
    vscode.commands.registerCommand('copycoder.parseClipboard', () =>
      clipboardHandler.parseClipboard()
    )
  );
}

function registerAllUIElements(context: vscode.ExtensionContext, configTreeProvider: ConfigTreeDataProvider) {
  console.log('Registering ConfigTreeDataProvider for copycoderConfig view...');
  const disposable = vscode.window.registerTreeDataProvider('copycoderConfig', configTreeProvider);
  context.subscriptions.push(disposable);
  console.log('ConfigTreeDataProvider registered successfully.');
}

async function performInitialSetup(
  context: vscode.ExtensionContext,
  globalConfigService: GlobalConfigService,
  configTreeProvider: ConfigTreeDataProvider
) {
  configTreeProvider.refresh();
  const extensionVersion = vscode.extensions.getExtension('copycoder.copycoder')?.packageJSON.version;
  const lastSeenVersion = context.globalState.get<string>('copycoder.lastSeenVersion');
  if (extensionVersion && extensionVersion !== lastSeenVersion) {
    MessageService.showInfo(`CopyCoder updated to version ${extensionVersion}.`);
    await context.globalState.update('copycoder.lastSeenVersion', extensionVersion);
  } else if (!lastSeenVersion && extensionVersion) {
    MessageService.showInfo('Welcome to CopyCoder! Configure it in the sidebar.');
    await context.globalState.update('copycoder.lastSeenVersion', extensionVersion);
  }
}

export function deactivate() {
  console.log('CopyCoder extension is deactivating...');
  console.log('CopyCoder deactivated.');
}