// src/handlers/configCommandHandler.ts
import * as vscode from 'vscode';
import { ConfigTreeItem } from '../ui/configTreeDataProvider';
import { GlobalConfigService } from '../services/globalConfigService';
import { MessageService } from '../services/messageService';
import { Config } from '../models/config';

export class ConfigCommandHandler {
  constructor(
    private configService: GlobalConfigService,
    private treeProvider: any // Note: treeProvider type should be properly defined if needed
  ) {}

  public async handleConfigTreeItem(item: ConfigTreeItem): Promise<void> {
    const config = this.configService.getConfig();

    switch (item.type) {
      case 'general-includeGlobalExtensions':
        config.includeGlobalExtensions = !config.includeGlobalExtensions;
        MessageService.showInfo(`Include Global Extensions: ${config.includeGlobalExtensions ? 'Enabled' : 'Disabled'}`);
        this.configService.saveConfig(config);
        vscode.commands.executeCommand('copycoder.refreshConfigTree');
        break;

      case 'general-applyGlobalBlacklist':
        config.applyGlobalBlacklist = !config.applyGlobalBlacklist;
        MessageService.showInfo(`Apply Global Blacklist: ${config.applyGlobalBlacklist ? 'Enabled' : 'Disabled'}`);
        this.configService.saveConfig(config);
        vscode.commands.executeCommand('copycoder.refreshConfigTree');
        break;

      case 'general-filterUsingGitignore':
        config.filterUsingGitignore = !config.filterUsingGitignore;
        MessageService.showInfo(`Filter Using .gitignore: ${config.filterUsingGitignore ? 'Enabled' : 'Disabled'}`);
        this.configService.saveConfig(config);
        vscode.commands.executeCommand('copycoder.refreshConfigTree');
        break;

      case 'extensions-global':
      case 'extensions-custom':
        const extType = item.type.split('-')[1];
        const confirmRemoveExt = await MessageService.prompt(`Remove ${item.label} from ${extType} extensions?`);
        if (confirmRemoveExt === 'Yes') {
          if (item.type === 'extensions-global') {
            config.globalExtensions = config.globalExtensions.filter((ext: string) => ext !== item.value);
          } else {
            config.customExtensions = config.customExtensions.filter((ext: string) => ext !== item.value);
          }
          MessageService.showInfo(`Removed extension: ${item.label} (${extType})`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'blacklist-global':
      case 'blacklist-custom':
        const blacklistType = item.type.split('-')[1];
        const confirmRemoveBlacklist = await MessageService.prompt(
          `Remove ${item.label} from ${blacklistType} blacklist?`
        );
        if (confirmRemoveBlacklist === 'Yes') {
          if (item.type === 'blacklist-global') {
            config.globalBlacklist = config.globalBlacklist.filter((b: string) => b !== item.value);
          } else {
            config.customBlacklist = config.customBlacklist.filter((b: string) => b !== item.value);
          }
          MessageService.showInfo(`Removed blacklist item: ${item.label} (${blacklistType})`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'projectType':
        const confirmToggle = await MessageService.prompt(`Disable ${item.label} project type?`);
        if (confirmToggle === 'Yes') {
          config.enabledProjectTypes = config.enabledProjectTypes.filter((type: string) => type !== item.value);
          MessageService.showInfo(`Disabled project type: ${item.label}`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'extensions-project':
        const confirmRemoveProjectExt = await MessageService.prompt(
          `Remove ${item.label} from ${item.parentLabel} extensions?`
        );
        if (confirmRemoveProjectExt === 'Yes' && item.value && item.parentLabel) {
          config.projectExtensions[item.parentLabel] = config.projectExtensions[item.parentLabel].filter(
            (ext: string) => ext !== item.value
          );
          MessageService.showInfo(`Removed extension: ${item.label} (${item.parentLabel})`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'blacklist-project':
        const confirmRemoveProjectBlacklist = await MessageService.prompt(
          `Remove ${item.label} from ${item.parentLabel} blacklist?`
        );
        if (confirmRemoveProjectBlacklist === 'Yes' && item.value && item.parentLabel) {
          config.projectBlacklist[item.parentLabel] = config.projectBlacklist[item.parentLabel].filter(
            (b: string) => b !== item.value
          );
          MessageService.showInfo(`Removed blacklist item: ${item.label} (${item.parentLabel})`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'add-global-extension':
        const globalExtInput = await MessageService.promptInput(
          'Enter global extension (e.g., .md):',
          'Enter global extension'
        );
        if (globalExtInput) {
          config.globalExtensions.push(globalExtInput);
          MessageService.showInfo(`Added global extension: ${globalExtInput}`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'add-custom-extension':
        const customExtInput = await MessageService.promptInput(
          'Enter custom extension (e.g., .custom):',
          'Enter custom extension'
        );
        if (customExtInput) {
          config.customExtensions.push(customExtInput);
          MessageService.showInfo(`Added custom extension: ${customExtInput}`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'add-project-extension':
        if (item.parentLabel) {
          const projectExtInput = await MessageService.promptInput(
            `Enter extension for ${item.parentLabel} (e.g., .ts):`,
            `Enter extension for ${item.parentLabel}`
          );
          if (projectExtInput) {
            config.projectExtensions[item.parentLabel] = [
              ...(config.projectExtensions[item.parentLabel] || []),
              projectExtInput,
            ];
            MessageService.showInfo(`Added extension: ${projectExtInput} (${item.parentLabel})`);
            this.configService.saveConfig(config);
            vscode.commands.executeCommand('copycoder.refreshConfigTree');
          }
        }
        break;

      case 'add-global-blacklist':
        const globalBlacklistInput = await MessageService.promptInput(
          'Enter global blacklist item (e.g., node_modules):',
          'Enter global blacklist item'
        );
        if (globalBlacklistInput) {
          config.globalBlacklist.push(globalBlacklistInput);
          MessageService.showInfo(`Added global blacklist item: ${globalBlacklistInput}`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'add-custom-blacklist':
        const customBlacklistInput = await MessageService.promptInput(
          'Enter custom blacklist item (e.g., temp):',
          'Enter custom blacklist item'
        );
        if (customBlacklistInput) {
          config.customBlacklist.push(customBlacklistInput);
          MessageService.showInfo(`Added custom blacklist item: ${customBlacklistInput}`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      case 'add-project-blacklist':
        if (item.parentLabel) {
          const projectBlacklistInput = await MessageService.promptInput(
            `Enter blacklist item for ${item.parentLabel} (e.g., dist):`,
            `Enter blacklist item for ${item.parentLabel}`
          );
          if (projectBlacklistInput) {
            config.projectBlacklist[item.parentLabel] = [
              ...(config.projectBlacklist[item.parentLabel] || []),
              projectBlacklistInput,
            ];
            MessageService.showInfo(`Added blacklist item: ${projectBlacklistInput} (${item.parentLabel})`);
            this.configService.saveConfig(config);
            vscode.commands.executeCommand('copycoder.refreshConfigTree');
          }
        }
        break;

      case 'add-project-type':
        const projectTypeInput = await MessageService.promptInput(
          'Enter project type (e.g., python):',
          'Enter project type'
        );
        if (projectTypeInput) {
          config.enabledProjectTypes.push(projectTypeInput);
          MessageService.showInfo(`Added project type: ${projectTypeInput}`);
          this.configService.saveConfig(config);
          vscode.commands.executeCommand('copycoder.refreshConfigTree');
        }
        break;

      default:
        break;
    }
  }
}