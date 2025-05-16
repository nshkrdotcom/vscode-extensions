import * as vscode from 'vscode';
import { GlobalConfigService } from '../services/globalConfigService';
//import { Config } from '../models/config';

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

export class ConfigTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private readonly configService: GlobalConfigService) {
    // Listen for config changes
    this.configService.onConfigChange(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }

    const config = this.configService.getConfig();

    if (element.label === 'General') {
      return this.getGeneralItems();
    }
    else if (element.label === 'Project Types') {
      return this.getProjectTypeItems();
    }
    else if (element.label === 'Extensions') {
      return this.getExtensionItems();
    }
    else if (element.label === 'Blacklist') {
      return this.getBlacklistItems();
    }
    else if (element.label === 'Global Extensions') {
      return this.getGlobalExtensionItems();
    }
    else if (element.label === 'Global Blacklist') {
      return this.getGlobalBlacklistItems();
    }
    else if (element.contextValue === 'projectType') {
      return this.getProjectTypeChildren(element.label as string);
    }
    else if (element.contextValue?.startsWith('project-extensions:')) {
      const projectType = element.contextValue.split(':')[1];
      return this.getCustomExtensionItems(projectType);
    }
    else if (element.contextValue?.startsWith('project-blacklist:')) {
      const projectType = element.contextValue.split(':')[1];
      return this.getCustomBlacklistItems(projectType);
    }
    else if (element.contextValue === 'extensions-custom') {
      return this.getCustomExtensionsRoot();
    }
    else if (element.contextValue === 'blacklist-custom') {
      return this.getCustomBlacklistRoot();
    }
    // Handle the case when contextValue is extensions-custom:node
    else if (element.contextValue?.startsWith('extensions-custom:')) {
      const projectType = element.contextValue.split(':')[1];
      return this.getCustomExtensionItems(projectType);
    }
    // Handle the case when contextValue is blacklist-custom:node
    else if (element.contextValue?.startsWith('blacklist-custom:')) {
      const projectType = element.contextValue.split(':')[1];
      return this.getCustomBlacklistItems(projectType);
    }

    return [];
  }

  private getRootItems(): vscode.TreeItem[] {
    return [
      new ConfigTreeItem('General', vscode.TreeItemCollapsibleState.Expanded),
      new ConfigTreeItem('Project Types', vscode.TreeItemCollapsibleState.Expanded),
      new ConfigTreeItem('Extensions', vscode.TreeItemCollapsibleState.Expanded),
      new ConfigTreeItem('Blacklist', vscode.TreeItemCollapsibleState.Expanded)
    ];
  }

  private getGeneralItems(): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    return [
      new ConfigTreeItem(
        'Include Global Extensions',
        vscode.TreeItemCollapsibleState.None,
        'toggleIncludeGlobalExtensions',
        'general-includeGlobalExtensions'
      ),
      new ConfigTreeItem(
        'Filter Using Gitignore',
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

  private getProjectTypeItems(): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    const items = config.projectTypes.map(pt =>
      new ConfigTreeItem(pt, vscode.TreeItemCollapsibleState.Expanded, 'deleteProjectType', 'projectType')
    );
    items.push(
      new ConfigTreeItem('Add Project Type', vscode.TreeItemCollapsibleState.None, 'addProjectType', 'add-project-type')
    );
    return items;
  }

  private getExtensionItems(): vscode.TreeItem[] {
    return [
      new ConfigTreeItem('Global Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, 'extensions-global'),
      new ConfigTreeItem('Custom Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, 'extensions-custom')
    ];
  }

  private getBlacklistItems(): vscode.TreeItem[] {
    return [
      new ConfigTreeItem('Global Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, 'blacklist-global'),
      new ConfigTreeItem('Custom Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, 'blacklist-custom')
    ];
  }

  private getGlobalExtensionItems(): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    const items = config.globalExtensions.map(ext =>
      new ConfigTreeItem(ext, vscode.TreeItemCollapsibleState.None, 'deleteGlobalExtension', 'extensions-global')
    );
    items.push(
      new ConfigTreeItem('Add Global Extension', vscode.TreeItemCollapsibleState.None, 'addGlobalExtension', 'add-global-extension')
    );
    return items;
  }

  private getGlobalBlacklistItems(): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    const items = config.globalBlacklist.map(item =>
      new ConfigTreeItem(item, vscode.TreeItemCollapsibleState.None, 'deleteGlobalBlacklist', 'blacklist-global')
    );
    items.push(
      new ConfigTreeItem('Add Global Blacklist', vscode.TreeItemCollapsibleState.None, 'addGlobalBlacklist', 'add-global-blacklist')
    );
    return items;
  }

  private getProjectTypeChildren(projectType: string): vscode.TreeItem[] {
    return [
      new ConfigTreeItem('Extensions', vscode.TreeItemCollapsibleState.Expanded, undefined, `project-extensions:${projectType}`),
      new ConfigTreeItem('Blacklist', vscode.TreeItemCollapsibleState.Expanded, undefined, `project-blacklist:${projectType}`)
    ];
  }

  private getCustomExtensionItems(projectType: string): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    const extensions = config.customExtensions[projectType] || [];
    const items = extensions.map(ext =>
      new ConfigTreeItem(ext, vscode.TreeItemCollapsibleState.None, 'deleteCustomExtension', `custom-extension:${projectType}:${ext}`)
    );
    items.push(
      new ConfigTreeItem('Add Extension', vscode.TreeItemCollapsibleState.None, 'addCustomExtension', `add-project-extension:${projectType}`)
    );
    return items;
  }

  private getCustomBlacklistItems(projectType: string): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    const blacklist = config.customBlacklist[projectType] || [];
    const items = blacklist.map(item =>
      new ConfigTreeItem(item, vscode.TreeItemCollapsibleState.None, 'deleteCustomBlacklist', `custom-blacklist:${projectType}:${item}`)
    );
    items.push(
      new ConfigTreeItem('Add Blacklist Item', vscode.TreeItemCollapsibleState.None, 'addCustomBlacklist', `add-project-blacklist:${projectType}`)
    );
    return items;
  }

  private getCustomExtensionsRoot(): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    return config.projectTypes.map(pt =>
      new ConfigTreeItem(pt, vscode.TreeItemCollapsibleState.Expanded, undefined, `project-extensions:${pt}`)
    );
  }

  private getCustomBlacklistRoot(): vscode.TreeItem[] {
    const config = this.configService.getConfig();
    return config.projectTypes.map(pt =>
      new ConfigTreeItem(pt, vscode.TreeItemCollapsibleState.Expanded, undefined, `project-blacklist:${pt}`)
    );
  }
}