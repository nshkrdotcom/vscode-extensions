import * as vscode from 'vscode';
import { GlobalConfigService } from '../services/globalConfigService';

export class ConfigTreeDataProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined | null | void> = new vscode.EventEmitter<ConfigTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
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
            const config = this.configService.getConfig();
            return Promise.resolve([
                new ConfigTreeItem('General', 'category', vscode.TreeItemCollapsibleState.Collapsed),
                new ConfigTreeItem('Extensions', 'category', vscode.TreeItemCollapsibleState.Collapsed),
                new ConfigTreeItem('Blacklist', 'category', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        }

        const config = this.configService.getConfig();
        if (element.label === 'General') {
            return Promise.resolve([
                new ConfigTreeItem('Include Global Extensions', 'boolean', vscode.TreeItemCollapsibleState.None, 'includeGlobalExtensions', undefined, config.includeGlobalExtensions ? 'Enabled' : 'Disabled'),
                new ConfigTreeItem('Apply Global Blacklist', 'boolean', vscode.TreeItemCollapsibleState.None, 'applyGlobalBlacklist', undefined, config.applyGlobalBlacklist ? 'Enabled' : 'Disabled')
            ]);
        } else if (element.label === 'Extensions') {
            return Promise.resolve(config.extensions.map(ext => 
                new ConfigTreeItem(ext, 'listItem', vscode.TreeItemCollapsibleState.None, 'extension', ext)
            ).concat([new ConfigTreeItem('Add Extension', 'action', vscode.TreeItemCollapsibleState.None, 'addExtension')]));
        } else if (element.label === 'Blacklist') {
            return Promise.resolve(config.blacklist.map(item => 
                new ConfigTreeItem(item, 'listItem', vscode.TreeItemCollapsibleState.None, 'blacklist', item)
            ).concat([new ConfigTreeItem('Add Blacklist Item', 'action', vscode.TreeItemCollapsibleState.None, 'addBlacklist')]));
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
        public readonly type: 'category' | 'boolean' | 'listItem' | 'action',
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        public readonly key?: string,
        public readonly value?: string,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.contextValue = type;
        if (type === 'boolean' || type === 'listItem' || type === 'action') {
            this.command = {
                command: 'copycoder.configTreeItemClicked',
                title: 'Handle Config Item',
                arguments: [this]
            };
        }
    }
}