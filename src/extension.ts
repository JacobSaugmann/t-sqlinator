import * as vscode from 'vscode';
import { TSqlinatorFormatter, TSqlinatorConfig } from './tSqlinatorFormatter';

function readUserConfig(): TSqlinatorConfig {
    const config = vscode.workspace.getConfiguration('t-sqlinator');
    return {
        keywordCase: config.get<'upper' | 'lower' | 'preserve'>('keywordCase', 'upper'),
        functionCase: config.get<'upper' | 'lower' | 'preserve'>('functionCase', 'upper'),
        dataTypeCase: config.get<'upper' | 'lower' | 'preserve'>('dataTypeCase', 'upper'),
        indentSize: config.get<number>('indentSize', 4),
        commaPosition: config.get<'before' | 'after'>('commaPosition', 'before'),
        alignCommas: config.get<boolean>('alignCommas', true),
        alignAliases: config.get<boolean>('alignAliases', true),
        newlineAfterSelect: config.get<boolean>('newlineAfterSelect', true),
        newlineBeforeFrom: config.get<boolean>('newlineBeforeFrom', true),
        newlineBeforeWhere: config.get<boolean>('newlineBeforeWhere', true),
        newlineBeforeGroupBy: config.get<boolean>('newlineBeforeGroupBy', true),
        newlineBeforeHaving: config.get<boolean>('newlineBeforeHaving', true),
        newlineBeforeOrderBy: config.get<boolean>('newlineBeforeOrderBy', true),
        linesBetweenQueries: config.get<number>('linesBetweenQueries', 2),
        useRiverFormatting: config.get<boolean>('useRiverFormatting', true),
        riverColumn: config.get<number>('riverColumn', 7),
        useIndentFormatting: config.get<boolean>('useIndentFormatting', false)
    };
}

export function activate(context: vscode.ExtensionContext): void {
    // Register a simple test command
    const testCommand = vscode.commands.registerCommand('t-sqlinator.test', () => {
        vscode.window.showInformationMessage('T-SQLinator test command works!');
    });

    // Register the formatting provider
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider(
        'sql',
        new SqlFormattingProvider()
    );

    // Register the manual format command
    const formatCommand = vscode.commands.registerCommand('t-sqlinator.formatDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found.');
            return;
        }
        
        if (editor.document.languageId !== 'sql') {
            vscode.window.showWarningMessage('Please open a SQL file to format.');
            return;
        }

        try {
            const text = editor.document.getText();
            const userConfig = readUserConfig();
            const sqlFormatter = new TSqlinatorFormatter(userConfig);
            const formattedText = sqlFormatter.format(text);

            // Apply the formatting to the document
            const fullRange = new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(text.length)
            );

            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, formattedText);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`SQL Formatting failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(testCommand, formattingProvider, formatCommand);
}

class SqlFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        
        const text = document.getText();
        
        try {
            const userConfig = readUserConfig();
            const sqlFormatter = new TSqlinatorFormatter(userConfig);
            const formattedText = sqlFormatter.format(text);

            // Create a TextEdit that replaces the entire document
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );

            return [vscode.TextEdit.replace(fullRange, formattedText)];
        } catch (error) {
            vscode.window.showErrorMessage(`SQL Formatting failed: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
}

export function deactivate() {}