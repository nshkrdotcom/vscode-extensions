import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "copy-code" is now active');

    let disposable = vscode.commands.registerCommand('copy-code.copyAllFiles', async () => {
        try {
            // Get all visible text editors instead of textDocuments
            const allEditors = vscode.window.visibleTextEditors;
            
            // Filter out .git files and duplicates
            const uniqueEditors = allEditors.filter(editor => {
                const path = editor.document.uri.fsPath;
                return !path.includes('.git') && 
                    !path.endsWith('.git');
            });
            
            if (uniqueEditors.length === 0) {
                vscode.window.showInformationMessage('No open text editors found');
                return;
            }

            const contents = uniqueEditors.map(editor => {
                const relativePath = vscode.workspace.asRelativePath(editor.document.uri);
                return `=== ${relativePath} ===\n${editor.document.getText()}\n`;
            }).join('\n');
            
            await vscode.env.clipboard.writeText(contents);
            vscode.window.showInformationMessage(
                `Copied content from ${uniqueEditors.length} files`
            );                
            // // Filter out temporary and empty files
            // const allDocs = vscode.workspace.textDocuments.filter(doc => {
            //     // Skip temporary git files
            //     if (doc.fileName.includes('git\\scm0\\')) {
            //         return false;
            //     }
            //     // Skip untitled (unsaved) files
            //     if (doc.isUntitled) {
            //         return false;
            //     }
            //     // Skip empty files
            //     if (doc.getText().trim().length === 0) {
            //         return false;
            //     }
            //     return true;
            // });
            
            // if (allDocs.length === 0) {
            //     vscode.window.showInformationMessage('No valid text documents found');
            //     return;
            // }

            // const contents = allDocs.map(doc => {
            //     const relativePath = vscode.workspace.asRelativePath(doc.fileName);
            //     return `=== ${relativePath} ===\n${doc.getText()}\n`;
            // }).join('\n');
            
            // await vscode.env.clipboard.writeText(contents);
            // vscode.window.showInformationMessage(
            //     `Copied content from ${allDocs.length} files to clipboard`
            // );
        } catch (error) {
            console.error('Error in copyAllFiles:', error);
            vscode.window.showErrorMessage(`Error copying files: ${error}`);
        }
    });

    // Create a simple tree view provider
    const treeDataProvider = new class implements vscode.TreeDataProvider<string> {
        getTreeItem(element: string): vscode.TreeItem {
            return new vscode.TreeItem(element);
        }
        getChildren(): string[] {
            return []; // Empty array for now, but you could add items here
        }
    };

    // Register the tree view
    vscode.window.createTreeView('copy-code-actions', {
        treeDataProvider
    });

    context.subscriptions.push(disposable);
}

// This function is called when your extension is deactivated
export function deactivate() {}