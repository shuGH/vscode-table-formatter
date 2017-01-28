'use strict';

import * as vscode from 'vscode';
import { TableInfo } from './table';
import { TableHelper } from './helper';
import { TableFormatter } from './formatter';
import { TableEditor } from './editor';

// Main
export function activate(context: vscode.ExtensionContext) {
    let tableFormatter = new TableFormatter();
    let tableEditor = new TableEditor();
    let tableHelper = new TableHelper();

    let formatCommand = vscode.commands.registerTextEditorCommand('extension.table.formatCurrent', (editor, edit) => {
        var pos = editor.selection.active;
        if (!tableHelper.isTableLine(editor.document.lineAt(pos.line))) return;

        var info = tableHelper.getTableInfo(editor.document, pos.line);
        var formatted = tableFormatter.getFormatTableText(editor.document, info);
        edit.replace(info.range, formatted);
    });

    let formatAllCommand = vscode.commands.registerTextEditorCommand('extension.table.formatAll', (editor, edit) => {
        for (var i = 0; i < editor.document.lineCount; i++) {
            if (!tableHelper.isTableLine(editor.document.lineAt(i))) continue;

            var info = tableHelper.getTableInfo(editor.document, i);
            var formatted = tableFormatter.getFormatTableText(editor.document, info);
            edit.replace(info.range, formatted);

            i = info.range.end.line;
        }
    });

    context.subscriptions.push(tableFormatter);
    context.subscriptions.push(tableEditor);
    context.subscriptions.push(tableHelper);

    context.subscriptions.push(formatCommand);
    context.subscriptions.push(formatAllCommand);
}

export function deactivate() {
}
