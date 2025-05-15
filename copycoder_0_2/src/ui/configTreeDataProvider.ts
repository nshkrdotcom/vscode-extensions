// src/ui/configTreeDataProvider.ts
import * as vscode from 'vscode';
import { GlobalConfigService } from '../services/globalConfigService';

export class ConfigTreeDataProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ConfigTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;
  private configService: GlobalConfigService;

  constructor(configService: GlobalConfigService) {
    this.configService = configService;
  }

  getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ConfigTreeItem): Thenable<ConfigTreeItem[]> {
    if (!element) {
      // Root: Show categories
      return Promise.resolve([
        new ConfigTreeItem('General', 'category', vscode.TreeItemCollapsibleState.Collapsed),
        new ConfigTreeItem('Extensions', 'category', vscode.TreeItemCollapsibleState.Collapsed),
        new ConfigTreeItem('Blacklist', 'category', vscode.TreeItemCollapsibleState.Collapsed),
      ]);
    }

    const config = this.configService.getConfig();
    if (element.label === 'General') {
      return Promise.resolve([
        new ConfigTreeItem(
          'Include Global Extensions',
          'boolean',
          vscode.TreeItemCollapsibleState.None,
          'includeGlobalExtensions',
          undefined,
          config.includeGlobalExtensions ? 'Enabled' : 'Disabled'
        ),
        new ConfigTreeItem(
          'Apply Global Blacklist',
          'boolean',
          vscode.TreeItemCollapsibleState.None,
          'applyGlobalBlacklist',
          undefined,
          config.applyGlobalBlacklist ? 'Enabled' : 'Disabled'
        ),
        new ConfigTreeItem(
          'Filter Using Gitignore',
          'boolean',
          vscode.TreeItemCollapsibleState.None,
          'filterUsingGitignore',
          undefined,
          config.filterUsingGitignore ? 'Enabled' : 'Disabled'
        ),
      ]);
    } else if (element.label === 'Extensions') {
      const projectItems = Object.keys(config.projectExtensions).map(
        (projectType) =>
          new ConfigTreeItem(
            projectType.charAt(0).toUpperCase() + projectType.slice(1),
            'projectType',
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined,
            projectType,
            undefined,
            undefined,
            'Extensions' // Explicitly set parentLabel
          )
      );
      const globalItem = new ConfigTreeItem(
        'Global Extensions',
        'globalExtensions',
        vscode.TreeItemCollapsibleState.Collapsed
      );
      return Promise.resolve([
        ...projectItems,
        new ConfigTreeItem('──────────', 'separator', vscode.TreeItemCollapsibleState.None),
        globalItem,
        new ConfigTreeItem('Add Project Type', 'action', vscode.TreeItemCollapsibleState.None, 'addProjectType'),
      ]);
    } else if (element.label === 'Blacklist') {
      const projectItems = Object.keys(config.projectBlacklist).map(
        (projectType) =>
          new ConfigTreeItem(
            projectType.charAt(0).toUpperCase() + projectType.slice(1),
            'projectType',
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined,
            projectType,
            undefined,
            undefined,
            'Blacklist' // Explicitly set parentLabel
          )
      );
      const globalItem = new ConfigTreeItem(
        'Global Blacklist',
        'globalBlacklist',
        vscode.TreeItemCollapsibleState.Collapsed
      );
      return Promise.resolve([
        ...projectItems,
        new ConfigTreeItem('──────────', 'separator', vscode.TreeItemCollapsibleState.None),
        globalItem,
        new ConfigTreeItem('Add Project Type', 'action', vscode.TreeItemCollapsibleState.None, 'addProjectTypeBlacklist'),
      ]);
    } else if (element.type === 'projectType' && element.value) {
      if (element.parentLabel === 'Extensions') {
        const extensions = config.projectExtensions[element.value] || [];
        return Promise.resolve(
          extensions
            .map(
              (ext) =>
                new ConfigTreeItem(
                  ext,
                  'listItem',
                  vscode.TreeItemCollapsibleState.None,
                  'extension',
                  ext,
                  undefined,
                  element.value
                )
            )
            .concat([
              new ConfigTreeItem(
                'Add Extension',
                'action',
                vscode.TreeItemCollapsibleState.None,
                'addExtension',
                element.value
              ),
            ])
        );
      } else if (element.parentLabel === 'Blacklist') {
        const blacklist = config.projectBlacklist[element.value] || [];
        return Promise.resolve(
          blacklist
            .map(
              (item) =>
                new ConfigTreeItem(
                  item,
                  'listItem',
                  vscode.TreeItemCollapsibleState.None,
                  'blacklist',
                  item,
                  undefined,
                  element.value
                )
            )
            .concat([
              new ConfigTreeItem(
                'Add Blacklist Item',
                'action',
                vscode.TreeItemCollapsibleState.None,
                'addBlacklist',
                element.value
              ),
            ])
        );
      }
    } else if (element.type === 'globalExtensions') {
      return Promise.resolve(
        config.globalExtensions
          .map(
            (ext) =>
              new ConfigTreeItem(
                ext,
                'listItem',
                vscode.TreeItemCollapsibleState.None,
                'extension',
                ext,
                undefined,
                'global'
              )
          )
          .concat([
            new ConfigTreeItem(
              'Add Global Extension',
              'action',
              vscode.TreeItemCollapsibleState.None,
              'addGlobalExtension'
            ),
          ])
      );
    } else if (element.type === 'globalBlacklist') {
      return Promise.resolve(
        config.globalBlacklist
          .map(
            (item) =>
              new ConfigTreeItem(
                item,
                'listItem',
                vscode.TreeItemCollapsibleState.None,
                'blacklist',
                item,
                undefined,
                'global'
              )
          )
          .concat([
            new ConfigTreeItem(
              'Add Global Blacklist Item',
              'action',
              vscode.TreeItemCollapsibleState.None,
              'addGlobalBlacklist'
            ),
          ])
      );
    }
    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export class ConfigTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: 'category' | 'boolean' | 'listItem' | 'action' | 'projectType' | 'globalExtensions' | 'globalBlacklist' | 'separator',
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly key?: string,
    public readonly value?: string,
    public readonly description?: string,
    public readonly projectType?: string,
    public readonly parentLabel?: string
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.contextValue = type;
    if (type === 'boolean' || type === 'listItem' || type === 'action') {
      this.command = {
        command: 'copycoder.configTreeItemClicked',
        title: 'Handle Config Item',
        arguments: [this],
      };
    }
    this.parentLabel = parentLabel || (type === 'projectType' ? label : undefined);
  }
}