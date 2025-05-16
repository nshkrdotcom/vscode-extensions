// src/handlers/configCommandHandler.ts
import { GlobalConfigService } from '../services/globalConfigService';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../ui/configTreeDataProvider';
import { Config, DEFAULT_CONFIG } from '../models/config';
import { MessageService } from '../services/messageService';
import * as vscode from 'vscode';

export class ConfigCommandHandler {
  constructor(
    private readonly globalConfigService: GlobalConfigService,
    private readonly treeProvider: ConfigTreeDataProvider
  ) {}

  async handleConfigTreeItem(item: ConfigTreeItem): Promise<void> {
    const config = this.globalConfigService.getConfig();

    try {
      // Toggle settings
      if (item.commandId === 'toggleIncludeGlobalExtensions') {
        config.includeGlobalExtensions = !config.includeGlobalExtensions;
      } else if (item.commandId === 'toggleFilterUsingGitignore') {
        config.filterUsingGitignore = !config.filterUsingGitignore;
      }
      // Reset configuration
      else if (item.commandId === 'resetConfig') {
        const choice = await vscode.window.showWarningMessage(
          'Are you sure you want to reset all CopyCoder settings to defaults? This cannot be undone.',
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          this.globalConfigService.saveConfig(DEFAULT_CONFIG);
          MessageService.showInfo('Configuration reset to defaults.');
        } else {
          return;
        }
      }
      // Delete actions
      else if (item.commandId === 'deleteProjectType') {
        const projectType = item.label;
        const choice = await vscode.window.showWarningMessage(
          `Are you sure you want to delete project type "${projectType}"?`,
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          config.projectTypes = config.projectTypes.filter(pt => pt !== projectType);
          delete config.customExtensions[projectType];
          delete config.customBlacklist[projectType];
          MessageService.showInfo(`Project type "${projectType}" deleted.`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'deleteGlobalExtension') {
        const ext = item.label;
        const choice = await vscode.window.showWarningMessage(
          `Are you sure you want to delete global extension "${ext}"?`,
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          config.globalExtensions = config.globalExtensions.filter(e => e !== ext);
          MessageService.showInfo(`Global extension "${ext}" deleted.`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'deleteCustomExtension') {
        const [, projectType, ext] = item.contextValue!.split(':');
        const choice = await vscode.window.showWarningMessage(
          `Are you sure you want to delete extension "${ext}" for project type "${projectType}"?`,
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          config.customExtensions[projectType] = (config.customExtensions[projectType] || []).filter(e => e !== ext);
          MessageService.showInfo(`Extension "${ext}" deleted for "${projectType}".`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'deleteGlobalBlacklist') {
        const itemName = item.label;
        const choice = await vscode.window.showWarningMessage(
          `Are you sure you want to delete global blacklist item "${itemName}"?`,
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          config.globalBlacklist = config.globalBlacklist.filter(b => b !== itemName);
          MessageService.showInfo(`Global blacklist item "${itemName}" deleted.`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'deleteCustomBlacklist') {
        const [, projectType, itemName] = item.contextValue!.split(':');
        const choice = await vscode.window.showWarningMessage(
          `Are you sure you want to delete blacklist item "${itemName}" for project type "${projectType}"?`,
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          config.customBlacklist[projectType] = (config.customBlacklist[projectType] || []).filter(b => b !== itemName);
          MessageService.showInfo(`Blacklist item "${itemName}" deleted for "${projectType}".`);
        } else {
          return;
        }
      }
      // Add actions
      else if (item.commandId === 'addProjectType') {
        const projectType = await vscode.window.showInputBox({
          prompt: 'Enter new project type (e.g., node, python)',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {return 'Project type cannot be empty.';}
            if (config.projectTypes.includes(value)) {return 'Project type already exists.';}
            return null;
          }
        });
        if (projectType) {
          config.projectTypes.push(projectType);
          config.customExtensions[projectType] = [];
          config.customBlacklist[projectType] = [];
          MessageService.showInfo(`Project type "${projectType}" added.`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'addGlobalExtension') {
        const ext = await vscode.window.showInputBox({
          prompt: 'Enter file extension (e.g., .js)',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {return 'Extension cannot be empty.';}
            if (!value.startsWith('.')) {return 'Extension must start with a dot.';}
            if (config.globalExtensions.includes(value)) {return 'Extension already exists.';}
            return null;
          }
        });
        if (ext) {
          config.globalExtensions.push(ext);
          MessageService.showInfo(`Global extension "${ext}" added.`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'addCustomExtension') {
        const projectType = item.contextValue!.split(':')[1];
        const ext = await vscode.window.showInputBox({
          prompt: `Enter file extension for ${projectType} (e.g., .js)`,
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {return 'Extension cannot be empty.';}
            if (!value.startsWith('.')) {return 'Extension must start with a dot.';}
            if ((config.customExtensions[projectType] || []).includes(value)) {return 'Extension already exists.';}
            return null;
          }
        });
        if (ext) {
          config.customExtensions[projectType] = (config.customExtensions[projectType] || []).concat(ext);
          MessageService.showInfo(`Extension "${ext}" added for "${projectType}".`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'addGlobalBlacklist') {
        const itemName = await vscode.window.showInputBox({
          prompt: 'Enter file or folder name to blacklist (e.g., node_modules)',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {return 'Blacklist item cannot be empty.';}
            if (config.globalBlacklist.includes(value)) {return 'Item already exists.';}
            return null;
          }
        });
        if (itemName) {
          config.globalBlacklist.push(itemName);
          MessageService.showInfo(`Global blacklist item "${itemName}" added.`);
        } else {
          return;
        }
      }
      else if (item.commandId === 'addCustomBlacklist') {
        const projectType = item.contextValue!.split(':')[1];
        const itemName = await vscode.window.showInputBox({
          prompt: `Enter file or folder name to blacklist for ${projectType}`,
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {return 'Blacklist item cannot be empty.';}
            if ((config.customBlacklist[projectType] || []).includes(value)) {return 'Item already exists.';}
            return null;
          }
        });
        if (itemName) {
          config.customBlacklist[projectType] = (config.customBlacklist[projectType] || []).concat(itemName);
          MessageService.showInfo(`Blacklist item "${itemName}" added for "${projectType}".`);
        } else {
          return;
        }
      }
      else {
        MessageService.showInfo(`Unknown command: ${item.commandId}`);
        return;
      }

      this.globalConfigService.saveConfig(config);
      this.treeProvider.refresh();
    } catch (error) {
      MessageService.showError(`Failed to update configuration: ${error}`);
    }
  }
}