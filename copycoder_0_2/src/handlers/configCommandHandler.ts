import * as vscode from 'vscode';
import { GlobalConfigService } from '../services/globalConfigService';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../ui/configTreeDataProvider';
import { MessageService } from '../services/messageService';

export class ConfigCommandHandler {
  constructor(
    private readonly globalConfigService: GlobalConfigService,
    private readonly treeProvider: ConfigTreeDataProvider
  ) {}

  async handleConfigTreeItem(item: ConfigTreeItem): Promise<void> {
    try {
      if (item.commandId === 'toggleIncludeGlobalExtensions') {
        const config = this.globalConfigService.getConfig();
        await this.globalConfigService.updateConfig({
          includeGlobalExtensions: !config.includeGlobalExtensions
        });
        this.treeProvider.refresh();
      } else if (item.commandId === 'toggleFilterUsingGitignore') {
        const config = this.globalConfigService.getConfig();
        await this.globalConfigService.updateConfig({
          filterUsingGitignore: !config.filterUsingGitignore
        });
        this.treeProvider.refresh();
      } else if (item.commandId === 'resetConfig') {
        const choice = await vscode.window.showWarningMessage(
          'Are you sure you want to reset the configuration to defaults?',
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          try {
            // First delete the existing config
            await this.globalConfigService.deleteConfig();
            // Then reset to default
            await this.globalConfigService.resetConfig();
            // Refresh the tree view
            this.treeProvider.refresh();
            await vscode.window.showInformationMessage('Configuration reset to defaults.');
          } catch (error) {
            console.error('Error resetting configuration:', error);
            MessageService.showError(`Failed to reset configuration: ${error}`);
          }
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
          const config = this.globalConfigService.getConfig();
          const newCustomExtensions = { ...config.customExtensions };
          const newCustomBlacklist = { ...config.customBlacklist };
          delete newCustomExtensions[projectType];
          delete newCustomBlacklist[projectType];
          await this.globalConfigService.updateConfig({
            projectTypes: config.projectTypes.filter(pt => pt !== projectType),
            customExtensions: newCustomExtensions,
            customBlacklist: newCustomBlacklist
          });
          this.treeProvider.refresh();
          MessageService.showInfo(`Project type "${projectType}" deleted.`);
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
          const config = this.globalConfigService.getConfig();
          await this.globalConfigService.updateConfig({
            globalExtensions: config.globalExtensions.filter(e => e !== ext)
          });
          this.treeProvider.refresh();
          MessageService.showInfo(`Global extension "${ext}" deleted.`);
        }
      }
      else if (item.commandId === 'deleteCustomExtension') {
        if (!item.contextValue) {
          throw new Error('Context value is undefined for deleteCustomExtension');
        }
        const [, projectType, ext] = item.contextValue.split(':');
        const choice = await vscode.window.showWarningMessage(
          `Are you sure you want to delete extension "${ext}" for project type "${projectType}"?`,
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          const config = this.globalConfigService.getConfig();
          const customExtensions = { ...config.customExtensions };
          customExtensions[projectType] = (customExtensions[projectType] || []).filter(e => e !== ext);
          await this.globalConfigService.updateConfig({ customExtensions });
          this.treeProvider.refresh();
          MessageService.showInfo(`Extension "${ext}" deleted for "${projectType}".`);
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
          const config = this.globalConfigService.getConfig();
          await this.globalConfigService.updateConfig({
            globalBlacklist: config.globalBlacklist.filter(b => b !== itemName)
          });
          this.treeProvider.refresh();
          MessageService.showInfo(`Global blacklist item "${itemName}" deleted.`);
        }
      }
      else if (item.commandId === 'deleteCustomBlacklist') {
        if (!item.contextValue) {
          throw new Error('Context value is undefined for deleteCustomBlacklist');
        }
        const [, projectType, itemName] = item.contextValue.split(':');
        const choice = await vscode.window.showWarningMessage(
          `Are you sure you want to delete blacklist item "${itemName}" for project type "${projectType}"?`,
          { modal: true },
          'Yes',
          'No'
        );
        if (choice === 'Yes') {
          const config = this.globalConfigService.getConfig();
          const customBlacklist = { ...config.customBlacklist };
          customBlacklist[projectType] = (customBlacklist[projectType] || []).filter(b => b !== itemName);
          await this.globalConfigService.updateConfig({ customBlacklist });
          this.treeProvider.refresh();
          MessageService.showInfo(`Blacklist item "${itemName}" deleted for "${projectType}".`);
        }
      }
      // Add actions
      else if (item.commandId === 'addProjectType') {
        const projectType = await vscode.window.showInputBox({ prompt: 'Enter project type' });
        if (projectType) {
          const config = this.globalConfigService.getConfig();
          if (!config.projectTypes.includes(projectType)) {
            await this.globalConfigService.updateConfig({
              projectTypes: [...config.projectTypes, projectType],
              customExtensions: { ...config.customExtensions, [projectType]: [] },
              customBlacklist: { ...config.customBlacklist, [projectType]: [] }
            });
            this.treeProvider.refresh();
            await vscode.window.showInformationMessage(`Project type ${projectType} added.`);
          }
        }
      }
      else if (item.commandId === 'addGlobalExtension') {
        const extension = await vscode.window.showInputBox({ prompt: 'Enter global extension (e.g., .txt)' });
        if (extension) {
          const config = this.globalConfigService.getConfig();
          if (!config.globalExtensions.includes(extension)) {
            await this.globalConfigService.updateConfig({
              globalExtensions: [...config.globalExtensions, extension]
            });
            this.treeProvider.refresh();
            await vscode.window.showInformationMessage(`Global extension ${extension} added.`);
          }
        }
      }
      else if (item.commandId === 'addCustomExtension') {
        if (!item.contextValue) {
          throw new Error('Context value is undefined for addCustomExtension');
        }
        const parts = item.contextValue.split(':');
        if (parts.length < 2) {
          throw new Error('Invalid context value format for addCustomExtension');
        }
        const projectType = parts[1];
        const extension = await vscode.window.showInputBox({ prompt: `Enter extension for ${projectType}` });
        if (extension) {
          const config = this.globalConfigService.getConfig();
          const customExtensions = { ...config.customExtensions };
          if (!customExtensions[projectType]) {
            customExtensions[projectType] = [];
          }
          if (!customExtensions[projectType].includes(extension)) {
            customExtensions[projectType] = [...customExtensions[projectType], extension];
            await this.globalConfigService.updateConfig({ customExtensions });
            this.treeProvider.refresh();
            await vscode.window.showInformationMessage(`Extension ${extension} added for ${projectType}.`);
          }
        }
      }
      else if (item.commandId === 'addGlobalBlacklist') {
        const itemName = await vscode.window.showInputBox({
          prompt: 'Enter file or folder name to blacklist (e.g., node_modules)',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) { return 'Blacklist item cannot be empty.'; }
            const config = this.globalConfigService.getConfig();
            if (config.globalBlacklist.includes(value)) { return 'Item already exists.'; }
            return null;
          }
        });
        if (itemName) {
          const config = this.globalConfigService.getConfig();
          config.globalBlacklist.push(itemName);
          await this.globalConfigService.saveConfig();
          this.treeProvider.refresh();
          MessageService.showInfo(`Global blacklist item "${itemName}" added.`);
        }
      }
      else if (item.commandId === 'addCustomBlacklist') {
        if (!item.contextValue) {
          throw new Error('Context value is undefined for addCustomBlacklist');
        }
        const parts = item.contextValue.split(':');
        if (parts.length < 2) {
          throw new Error('Invalid context value format for addCustomBlacklist');
        }
        const projectType = parts[1];
        const blacklistItem = await vscode.window.showInputBox({ prompt: `Enter blacklist item for ${projectType}` });
        if (blacklistItem) {
          const config = this.globalConfigService.getConfig();
          const customBlacklist = { ...config.customBlacklist };
          if (!customBlacklist[projectType]) {
            customBlacklist[projectType] = [];
          }
          if (!customBlacklist[projectType].includes(blacklistItem)) {
            customBlacklist[projectType] = [...customBlacklist[projectType], blacklistItem];
            await this.globalConfigService.updateConfig({ customBlacklist });
            this.treeProvider.refresh();
            await vscode.window.showInformationMessage(`Blacklist item ${blacklistItem} added for ${projectType}.`);
          }
        }
      }
      else {
        MessageService.showInfo(`Unknown command: ${item.commandId}`);
      }
    } catch (error) {
      MessageService.showError(`Failed to update configuration: ${error}`);
    }
  }
}