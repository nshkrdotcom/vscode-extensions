// src/extension.ts
import * as vscode from 'vscode';
import { ConfigTreeDataProvider, ConfigTreeItem } from './ui/configTreeDataProvider';
import { GlobalConfigService } from './services/globalConfigService';
import { MessageService } from './services/messageService';
import { NodeFileSystem } from './services/fileSystem';

export function activate(context: vscode.ExtensionContext) {
  const fileSystem = new NodeFileSystem();
  const configService = new GlobalConfigService(fileSystem);
  const configTreeProvider = new ConfigTreeDataProvider(configService);

  vscode.window.registerTreeDataProvider('copycoderConfig', configTreeProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('copycoder.configTreeItemClicked', async (item: ConfigTreeItem) => {
      const config = configService.getConfig();

      if (item.type === 'boolean') {
        if (item.key === 'includeGlobalExtensions') {
          config.includeGlobalExtensions = !config.includeGlobalExtensions;
          MessageService.showInfo(`Include Global Extensions: ${config.includeGlobalExtensions ? 'Enabled' : 'Disabled'}`);
        } else if (item.key === 'applyGlobalBlacklist') {
          config.applyGlobalBlacklist = !config.applyGlobalBlacklist;
          MessageService.showInfo(`Apply Global Blacklist: ${config.applyGlobalBlacklist ? 'Enabled' : 'Disabled'}`);
        } else if (item.key === 'filterUsingGitignore') {
          config.filterUsingGitignore = !config.filterUsingGitignore;
          MessageService.showInfo(`Filter Using Gitignore: ${config.filterUsingGitignore ? 'Enabled' : 'Disabled'}`);
        }
        configService.saveConfig(config);
        configTreeProvider.refresh();
      } else if (item.type === 'listItem' && item.value && item.projectType) {
        const isExtension = item.key === 'extension';
        const listType = isExtension ? 'extensions' : 'blacklist';
        const scope = item.projectType === 'global' ? 'global' : `project (${item.projectType})`;
        const confirmation = await vscode.window.showInformationMessage(
          `Are you sure you want to remove "${item.value}" from the ${scope} ${listType}?`,
          { modal: true },
          'Yes',
          'No'
        );

        if (confirmation === 'Yes') {
          if (isExtension) {
            if (item.projectType === 'global') {
              config.globalExtensions = config.globalExtensions.filter((ext) => ext !== item.value);
            } else {
              config.projectExtensions[item.projectType] = (config.projectExtensions[item.projectType] || []).filter(
                (ext) => ext !== item.value
              );
            }
            MessageService.showInfo(`Removed extension: ${item.value} (${scope})`);
          } else {
            if (item.projectType === 'global') {
              config.globalBlacklist = config.globalBlacklist.filter((b) => b !== item.value);
            } else {
              config.projectBlacklist[item.projectType] = (config.projectBlacklist[item.projectType] || []).filter(
                (b) => b !== item.value
              );
            }
            MessageService.showInfo(`Removed blacklist item: ${item.value} (${scope})`);
          }
          configService.saveConfig(config);
          configTreeProvider.refresh();
        }
      } else if (item.type === 'action') {
        if (item.key === 'addExtension' && item.value) {
          const value = await MessageService.promptInput(
            `Add Extension for ${item.value}`,
            `Enter extension (e.g., .py) for ${item.value}`
          );
          if (value && !config.projectExtensions[item.value]?.includes(value)) {
            config.projectExtensions[item.value] = [...(config.projectExtensions[item.value] || []), value];
            configService.saveConfig(config);
            MessageService.showInfo(`Added extension: ${item.value} (${item.value})`);
            configTreeProvider.refresh();
          }
        } else if (item.key === 'addGlobalExtension') {
          const value = await MessageService.promptInput('Add Global Extension', 'Enter extension (e.g., .md)');
          if (value && !config.globalExtensions.includes(value)) {
            config.globalExtensions.push(value);
            configService.saveConfig(config);
            MessageService.showInfo(`Added global extension: ${value}`);
            configTreeProvider.refresh();
          }
        } else if (item.key === 'addBlacklist' && item.value) {
          const value = await MessageService.promptInput(
            `Add Blacklist Item for ${item.value}`,
            `Enter blacklist item (e.g., __pycache__) for ${item.value}`
          );
          if (value && !config.projectBlacklist[item.value]?.includes(value)) {
            config.projectBlacklist[item.value] = [...(config.projectBlacklist[item.value] || []), value];
            configService.saveConfig(config);
            MessageService.showInfo(`Added blacklist item: ${value} (${item.value})`);
            configTreeProvider.refresh();
          }
        } else if (item.key === 'addGlobalBlacklist') {
          const value = await MessageService.promptInput('Add Global Blacklist Item', 'Enter blacklist item (e.g., node_modules)');
          if (value && !config.globalBlacklist.includes(value)) {
            config.globalBlacklist.push(value);
            configService.saveConfig(config);
            MessageService.showInfo(`Added global blacklist item: ${value}`);
            configTreeProvider.refresh();
          }
        } else if (item.key === 'addProjectType' || item.key === 'addProjectTypeBlacklist') {
          const value = await MessageService.promptInput(
            'Add Project Type',
            'Enter project type (e.g., python, typescript)'
          );
          if (value) {
            const normalizedValue = value.toLowerCase();
            if (item.key === 'addProjectType' && !config.projectExtensions[normalizedValue]) {
              config.projectExtensions[normalizedValue] = [];
              configService.saveConfig(config);
              MessageService.showInfo(`Added project type: ${normalizedValue} (Extensions)`);
              configTreeProvider.refresh();
            } else if (item.key === 'addProjectTypeBlacklist' && !config.projectBlacklist[normalizedValue]) {
              config.projectBlacklist[normalizedValue] = [];
              configService.saveConfig(config);
              MessageService.showInfo(`Added project type: ${normalizedValue} (Blacklist)`);
              configTreeProvider.refresh();
            }
          }
        }
      }
    })
  );
}

export function deactivate() {}