import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ConfigTreeDataProvider, ConfigTreeItem } from '../../../ui/configTreeDataProvider';
import { GlobalConfigService } from '../../../services/globalConfigService';
import { NodeFileSystem } from '../../../services/fileSystem'; // Import NodeFileSystem

suite('ConfigTreeDataProvider Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let configService: GlobalConfigService;
    let treeProvider: ConfigTreeDataProvider;

    setup(() => {
        sandbox = sinon.createSandbox();
        const fileSystem = new NodeFileSystem(); // Create FileSystem instance
        configService = new GlobalConfigService(fileSystem); // Pass to GlobalConfigService
        treeProvider = new ConfigTreeDataProvider(configService);
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should provide root categories', async () => {
        const children = await treeProvider.getChildren();
        assert.strictEqual(children.length, 3, 'Should have 3 root categories');
        assert.strictEqual(children[0].label, 'General', 'First category should be General');
        assert.strictEqual(children[1].label, 'Extensions', 'Second category should be Extensions');
        assert.strictEqual(children[2].label, 'Blacklist', 'Third category should be Blacklist');
        assert.strictEqual(children[0].collapsibleState, vscode.TreeItemCollapsibleState.Collapsed, 'Categories should be collapsible');
    });

    test('should provide General category items', async () => {
        const generalItem = new ConfigTreeItem('General', 'category', vscode.TreeItemCollapsibleState.Collapsed);
        const children = await treeProvider.getChildren(generalItem);
        assert.strictEqual(children.length, 2, 'General should have 2 items');
        assert.strictEqual(children[0].label, 'Include Global Extensions', 'First item should be Include Global Extensions');
        assert.strictEqual(children[1].label, 'Apply Global Blacklist', 'Second item should be Apply Global Blacklist');
        assert.strictEqual(children[0].type, 'boolean', 'Items should be boolean type');
    });

    test('should provide Extensions category items', async () => {
        sandbox.stub(configService, 'getConfig').returns({
            includeGlobalExtensions: true,
            applyGlobalBlacklist: true,
            extensions: ['.js', '.ts'],
            blacklist: ['node_modules']
        });
        const extensionsItem = new ConfigTreeItem('Extensions', 'category', vscode.TreeItemCollapsibleState.Collapsed);
        const children = await treeProvider.getChildren(extensionsItem);
        assert.strictEqual(children.length, 3, 'Extensions should have 2 items + Add action');
        assert.strictEqual(children[0].label, '.js', 'First item should be .js');
        assert.strictEqual(children[1].label, '.ts', 'Second item should be .ts');
        assert.strictEqual(children[2].label, 'Add Extension', 'Third item should be Add Extension');
        assert.strictEqual(children[0].type, 'listItem', 'Extension items should be listItem type');
        assert.strictEqual(children[2].type, 'action', 'Add item should be action type');
    });

    test('should provide Blacklist category items', async () => {
        sandbox.stub(configService, 'getConfig').returns({
            includeGlobalExtensions: true,
            applyGlobalBlacklist: true,
            extensions: ['.js'],
            blacklist: ['node_modules', 'dist']
        });
        const blacklistItem = new ConfigTreeItem('Blacklist', 'category', vscode.TreeItemCollapsibleState.Collapsed);
        const children = await treeProvider.getChildren(blacklistItem);
        assert.strictEqual(children.length, 3, 'Blacklist should have 2 items + Add action');
        assert.strictEqual(children[0].label, 'node_modules', 'First item should be node_modules');
        assert.strictEqual(children[1].label, 'dist', 'Second item should be dist');
        assert.strictEqual(children[2].label, 'Add Blacklist Item', 'Third item should be Add Blacklist Item');
        assert.strictEqual(children[0].type, 'listItem', 'Blacklist items should be listItem type');
        assert.strictEqual(children[2].type, 'action', 'Add item should be action type');
    });

    test('should refresh tree on demand', () => {
        const spy = sandbox.spy(treeProvider['_onDidChangeTreeData'], 'fire');
        treeProvider.refresh();
        assert.strictEqual(spy.calledOnce, true, 'Should fire refresh event');
    });
});