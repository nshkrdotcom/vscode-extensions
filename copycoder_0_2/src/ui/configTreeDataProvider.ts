import * as vscode from 'vscode';
import { GlobalConfigService } from '../services/globalConfigService';
import { Config } from '../models/config';

export class ConfigTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly commandId?: string,
    public readonly contextValue?: string,
    public readonly parentLabel?: string
  ) {
    super(label, collapsibleState);
    if (commandId) {
      this.command = {
        command: 'copycoder.configTreeItemClicked',
        title: '',
        arguments: [this]
      };
    }
    this.contextValue = contextValue;
  }
}

export class ConfigTreeDataProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ConfigTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private readonly globalConfigService: GlobalConfigService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ConfigTreeItem): Promise<ConfigTreeItem[]> {
    const config = this.globalConfigService.getConfig();

    if (!element) {
      return [
        new ConfigTreeItem('General', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category'),
        new ConfigTreeItem('Project Types', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category'),
        new ConfigTreeItem('Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category'),
        new ConfigTreeItem('Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, 'category')
      ];
    }

    if (element.label === 'General') {
      return [
        new ConfigTreeItem(
          `Include Global Extensions: ${config.includeGlobalExtensions ? 'Enabled' : 'Disabled'}`,
          vscode.TreeItemCollapsibleState.None,
          'toggleIncludeGlobalExtensions',
          'general-includeGlobalExtensions'
        ),
        new ConfigTreeItem(
          `Filter Using Gitignore: ${config.filterUsingGitignore ? 'Enabled' : 'Disabled'}`,
          vscode.TreeItemCollapsibleState.None,
          'toggleFilterUsingGitignore',
          'general-filterUsingGitignore'
        ),
        new ConfigTreeItem(
          'Reset Configuration',
          vscode.TreeItemCollapsibleState.None,
          'resetConfig',
          'general-resetConfig'
        )
      ];
    }

    if (element.label === 'Project Types') {
      const items = config.projectTypes.map(pt =>
        new ConfigTreeItem(pt, vscode.TreeItemCollapsibleState.None, 'deleteProjectType', 'projectType', 'Project Types')
      );
      items.push(
        new ConfigTreeItem('Add Project Type', vscode.TreeItemCollapsibleState.None, 'addProjectType', 'add-project-type')
      );
      return items;
    }

    if (element.label === 'Extensions') {
      return [
        new ConfigTreeItem('Global Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, 'extensions-global-list'),
        new ConfigTreeItem('Custom Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, 'extensions-custom-list')
      ];
    }

    if (element.label === 'Global Extensions') {
      const items = config.globalExtensions.map(ext =>
        new ConfigTreeItem(ext, vscode.TreeItemCollapsibleState.None, 'deleteGlobalExtension', 'extensions-global', 'Global Extensions')
      );
      items.push(
        new ConfigTreeItem('Add Global Extension', vscode.TreeItemCollapsibleState.None, 'addGlobalExtension', 'add-global-extension')
      );
      return items;
    }

    if (element.label === 'Custom Extensions') {
      return config.projectTypes.map(pt =>
        new ConfigTreeItem(pt, vscode.TreeItemCollapsibleState.Expanded, undefined, 'extensions-project-list', 'Custom Extensions')
      );
    }

    if (element.label === 'Blacklist') {
      return [
        new ConfigTreeItem('Global Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, 'blacklist-global-list'),
        new ConfigTreeItem('Custom Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, 'blacklist-custom-list')
      ];
    }

    if (element.label === 'Global Blacklist') {
      const items = config.globalBlacklist.map(item =>
        new ConfigTreeItem(item, vscode.TreeItemCollapsibleState.None, 'deleteGlobalBlacklist', 'blacklist-global', 'Global Blacklist')
      );
      items.push(
        new ConfigTreeItem('Add Global Blacklist Item', vscode.TreeItemCollapsibleState.None, 'addGlobalBlacklist', 'add-global-blacklist')
      );
      return items;
    }

    if (element.label === 'Custom Blacklist') {
      return config.projectTypes.map(pt =>
        new ConfigTreeItem(pt, vscode.TreeItemCollapsibleState.Collapsed, undefined, 'blacklist-project-list', 'Custom Blacklist')
      );
    }

    if (config.projectTypes.includes(element.label)) {
      if (element.contextValue === 'extensions-project-list') {
        const extensions = config.customExtensions[element.label] || [];
        if (extensions.length === 0) {
          return [
            new ConfigTreeItem('Add Extension', vscode.TreeItemCollapsibleState.None, 'addCustomExtension', `add-project-extension:${element.label}`, element.label)
          ];
        }
        const items = extensions.map(ext =>
          new ConfigTreeItem(ext, vscode.TreeItemCollapsibleState.None, 'deleteCustomExtension', `extensions-project:${element.label}:${ext}`, element.label)
        );
        items.push(
          new ConfigTreeItem('Add Extension', vscode.TreeItemCollapsibleState.None, 'addCustomExtension', `add-project-extension:${element.label}`, element.label)
        );
        return items;
      }
      if (element.contextValue === 'blacklist-project-list') {
        const extensions = config.customBlacklist[element.label] || [];
        if (extensions.length === 0) {
          return [
            new ConfigTreeItem('Add Blacklist Item', vscode.TreeItemCollapsibleState.None, 'addCustomBlacklist', `add-project-blacklist:${element.label}`, element.label)
          ];
        }
        const items = extensions.map(ext =>
          new ConfigTreeItem(ext, vscode.TreeItemCollapsibleState.None, 'deleteCustomBlacklist', `blacklist-project:${element.label}:${ext}`, element.label)
        );
        items.push(
          new ConfigTreeItem('Add Blacklist Item', vscode.TreeItemCollapsibleState.None, 'addCustomBlacklist', `add-project-blacklist:${element.label}`, element.label)
        );
        return items;
      }
      // if (element.contextValue === 'blacklist-project-list') {
      //   const items = (config.customBlacklist[element.label] || []).map(item =>
      //     new ConfigTreeItem(item, vscode.TreeItemCollapsibleState.None, 'deleteCustomBlacklist', `blacklist-project:${element.label}:${item}`, element.label)
      //   );
      //   items.push(
      //     new ConfigTreeItem('Add Blacklist Item', vscode.TreeItemCollapsibleState.None, 'addCustomBlacklist', `add-project-blacklist:${element.label}`, element.label)
      //   );
      //   return items;
      // }
    }

    return [];
  }
}