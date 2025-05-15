import * as vscode from 'vscode';
import { ConfigTreeDataProvider, ConfigTreeItem } from './ui/configTreeDataProvider';
import { GlobalConfigService } from './services/globalConfigService';
import { MessageService } from './services/messageService';
import { NodeFileSystem } from './services/fileSystem'; // Import NodeFileSystem

export function activate(context: vscode.ExtensionContext) {
    const fileSystem = new NodeFileSystem(); // Create FileSystem instance
    const configService = new GlobalConfigService(fileSystem); // Pass to GlobalConfigService
    const configTreeProvider = new ConfigTreeDataProvider(configService);
    
    vscode.window.registerTreeDataProvider('copycoderConfig', configTreeProvider);
    
    context.subscriptions.push(vscode.commands.registerCommand('copycoder.configTreeItemClicked', async (item: ConfigTreeItem) => {
        const config = configService.getConfig();
        if (item.type === 'boolean') {
            if (item.key === 'includeGlobalExtensions') {
                config.includeGlobalExtensions = !config.includeGlobalExtensions;
                MessageService.showInfo(`Include Global Extensions: ${config.includeGlobalExtensions ? 'Enabled' : 'Disabled'}`);
            } else if (item.key === 'applyGlobalBlacklist') {
                config.applyGlobalBlacklist = !config.applyGlobalBlacklist;
                MessageService.showInfo(`Apply Global Blacklist: ${config.applyGlobalBlacklist ? 'Enabled' : 'Disabled'}`);
            }
            configService.saveConfig(config);
            configTreeProvider.refresh();
        } else if (item.type === 'listItem' && item.value) {
            if (item.key === 'extension') {
                config.extensions = config.extensions.filter(ext => ext !== item.value);
                MessageService.showInfo(`Removed extension: ${item.value}`);
            } else if (item.key === 'blacklist') {
                config.blacklist = config.blacklist.filter(b => b !== item.value);
                MessageService.showInfo(`Removed blacklist item: ${item.value}`);
            }
            configService.saveConfig(config);
            configTreeProvider.refresh();
        } else if (item.type === 'action') {
            if (item.key === 'addExtension') {
                const value = await MessageService.promptInput('Add Extension', 'Enter extension (e.g., .js)');
                if (value && !config.extensions.includes(value)) {
                    config.extensions.push(value);
                    configService.saveConfig(config);
                    MessageService.showInfo(`Added extension: ${value}`);
                    configTreeProvider.refresh();
                }
            } else if (item.key === 'addBlacklist') {
                const value = await MessageService.promptInput('Add Blacklist Item', 'Enter blacklist item (e.g., node_modules)');
                if (value && !config.blacklist.includes(value)) {
                    config.blacklist.push(value);
                    configService.saveConfig(config);
                    MessageService.showInfo(`Added blacklist item: ${value}`);
                    configTreeProvider.refresh();
                }
            }
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('copycoder.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from CopyCoder!');
    }));
}

export function deactivate() {}