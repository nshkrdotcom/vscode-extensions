// src/ui/configTreeDataProvider.ts
import * as vscode from 'vscode';
import { GlobalConfigService } from '../services/globalConfigService';
import { Config } from '../models/config';

export class ConfigTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: string,
    public readonly value?: string,
    public readonly parentLabel?: string,
    public readonly projectType?: string
  ) {
    super(label, collapsibleState);
    this.contextValue = type;
    this.tooltip = `${this.label}${this.value ? `: ${this.value}` : ''}`;
    this.description = this.value;
  }
}

export class ConfigTreeDataProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ConfigTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private configService: GlobalConfigService) {}

  getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ConfigTreeItem): ConfigTreeItem[] {
    if (!element) {
      return [
        new ConfigTreeItem('General', vscode.TreeItemCollapsibleState.Expanded, 'category'),
        new ConfigTreeItem('Project Types', vscode.TreeItemCollapsibleState.Expanded, 'category'),
        new ConfigTreeItem('Extensions', vscode.TreeItemCollapsibleState.Expanded, 'category'),
        new ConfigTreeItem('Blacklist', vscode.TreeItemCollapsibleState.Expanded, 'category'),
      ];
    }

    const config = this.configService.getConfig();

    switch (element.type) {
      case 'category':
        if (element.label === 'General') {
          return [
            new ConfigTreeItem(
              'Include Global Extensions',
              vscode.TreeItemCollapsibleState.None,
              'general-includeGlobalExtensions',
              config.includeGlobalExtensions ? 'Enabled' : 'Disabled'
            ),
            new ConfigTreeItem(
              'Apply Global Blacklist',
              vscode.TreeItemCollapsibleState.None,
              'general-applyGlobalBlacklist',
              config.applyGlobalBlacklist ? 'Enabled' : 'Disabled'
            ),
            new ConfigTreeItem(
              'Filter Using .gitignore',
              vscode.TreeItemCollapsibleState.None,
              'general-filterUsingGitignore',
              config.filterUsingGitignore ? 'Enabled' : 'Disabled'
            ),
          ];
        } else if (element.label === 'Project Types') {
          return [
            ...config.enabledProjectTypes.map((type: string) =>
              new ConfigTreeItem(type, vscode.TreeItemCollapsibleState.None, 'projectType', type, 'Project Types', type)
            ),
            new ConfigTreeItem('Add Project Type', vscode.TreeItemCollapsibleState.None, 'add-project-type'),
          ];
        } else if (element.label === 'Extensions') {
          return [
            new ConfigTreeItem('Global Extensions', vscode.TreeItemCollapsibleState.Collapsed, 'extensions-global-list'),
            new ConfigTreeItem('Custom Extensions', vscode.TreeItemCollapsibleState.Collapsed, 'extensions-custom-list'),
            ...Object.keys(config.projectExtensions)
              .filter((type) => config.enabledProjectTypes.includes(type))
              .map((type) =>
                new ConfigTreeItem(
                  type,
                  vscode.TreeItemCollapsibleState.Collapsed,
                  'extensions-project-list',
                  type,
                  'Extensions',
                  type
                )
              ),
          ];
        } else if (element.label === 'Blacklist') {
          return [
            new ConfigTreeItem('Global Blacklist', vscode.TreeItemCollapsibleState.Collapsed, 'blacklist-global-list'),
            new ConfigTreeItem('Custom Blacklist', vscode.TreeItemCollapsibleState.Collapsed, 'blacklist-custom-list'),
            ...Object.keys(config.projectBlacklist)
              .filter((type) => config.enabledProjectTypes.includes(type))
              .map((type) =>
                new ConfigTreeItem(
                  type,
                  vscode.TreeItemCollapsibleState.Collapsed,
                  'blacklist-project-list',
                  type,
                  'Blacklist',
                  type
                )
              ),
          ];
        }
        return [];

      case 'extensions-global-list':
        return [
          ...config.globalExtensions.map((ext: string) =>
            new ConfigTreeItem(ext, vscode.TreeItemCollapsibleState.None, 'extensions-global', ext, 'Global Extensions', 'global')
          ),
          new ConfigTreeItem('Add Global Extension', vscode.TreeItemCollapsibleState.None, 'add-global-extension'),
        ];

      case 'extensions-custom-list':
        return [
          ...config.customExtensions.map((ext: string) =>
            new ConfigTreeItem(ext, vscode.TreeItemCollapsibleState.None, 'extensions-custom', ext, 'Custom Extensions', 'custom')
          ),
          new ConfigTreeItem('Add Custom Extension', vscode.TreeItemCollapsibleState.None, 'add-custom-extension'),
        ];

      case 'extensions-project-list':
        if (element.value && config.projectExtensions[element.value]) {
          return [
            ...config.projectExtensions[element.value].map((ext: string) =>
              new ConfigTreeItem(
                ext,
                vscode.TreeItemCollapsibleState.None,
                'extensions-project',
                ext,
                element.value,
                element.value
              )
            ),
            new ConfigTreeItem('Add Extension', vscode.TreeItemCollapsibleState.None, 'add-project-extension', undefined, element.value, element.value),
          ];
        }
        return [];

      case 'blacklist-global-list':
        return [
          ...config.globalBlacklist.map((item: string) =>
            new ConfigTreeItem(item, vscode.TreeItemCollapsibleState.None, 'blacklist-global', item, 'Global Blacklist', 'global')
          ),
          new ConfigTreeItem('Add Global Blacklist Item', vscode.TreeItemCollapsibleState.None, 'add-global-blacklist'),
        ];

      case 'blacklist-custom-list':
        return [
          ...config.customBlacklist.map((item: string) =>
            new ConfigTreeItem(item, vscode.TreeItemCollapsibleState.None, 'blacklist-custom', item, 'Custom Blacklist', 'custom')
          ),
          new ConfigTreeItem('Add Custom Blacklist Item', vscode.TreeItemCollapsibleState.None, 'add-custom-blacklist'),
        ];

      case 'blacklist-project-list':
        if (element.value && config.projectBlacklist[element.value]) {
          return [
            ...config.projectBlacklist[element.value].map((item: string) =>
              new ConfigTreeItem(
                item,
                vscode.TreeItemCollapsibleState.None,
                'blacklist-project',
                item,
                element.value,
                element.value
              )
            ),
            new ConfigTreeItem('Add Blacklist Item', vscode.TreeItemCollapsibleState.None, 'add-project-blacklist', undefined, element.value, element.value),
          ];
        }
        return [];

      default:
        return [];
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}