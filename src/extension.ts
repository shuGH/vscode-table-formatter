'use strict';

import * as vscode from 'vscode';
import { TableInfo } from './table';
import { TableHelper, TableFormatType, TableLineFlag } from './helper';
import { TableFormatter } from './formatter';
import { TableEditor } from './editor';

// Main
export function activate(context: vscode.ExtensionContext) {
    let tableFormatter = new TableFormatter();
    let tableEditor = new TableEditor();
    let tableHelper = new TableHelper();

    let formatCommand = vscode.commands.registerTextEditorCommand('extension.table.formatCurrent', (editor, edit) => {
        var pos = editor.selection.active;

        // 範囲の取得（Normal）
        var range = tableHelper.getTableRange(editor.document, pos.line, TableFormatType.Normal);
        // フォーマット（Normal）
        if (!range.isEmpty) {
            var info = tableHelper.getTableInfo(editor.document, range, TableFormatType.Normal);
            var formatted = tableFormatter.getFormatTableText(editor.document, info, TableFormatType.Normal);
            edit.replace(info.range, formatted);

            console.log("Table: Formatting succeeded!", "start: " + info.range.start.line, "end: " + info.range.end.line, "row: " + info.size.row, "col: " + (info.size.col - 1));
        }
        else {
            // 範囲の取得（Simple）
            var range = tableHelper.getTableRange(editor.document, pos.line, TableFormatType.Simple);
            // フォーマット（Simple）
            if (!range.isEmpty) {
                var info = tableHelper.getTableInfo(editor.document, range, TableFormatType.Simple);
                var formatted = tableFormatter.getFormatTableText(editor.document, info, TableFormatType.Simple);
                edit.replace(info.range, formatted);

                console.log("Table: Formatting simple succeeded!", "start: " + info.range.start.line, "end: " + info.range.end.line, "row: " + info.size.row, "col: " + (info.size.col - 1));
            }
        }
    });

    let formatAllCommand = vscode.commands.registerTextEditorCommand('extension.table.formatAll', (editor, edit) => {
        var normalNum = 0;
        var simpleNum = 0;

        var targetLines = [];
        var rangeLines = [];
        for (var i = 0; i < editor.document.lineCount; i++) {
            // 範囲の取得（Normal）
            var range = tableHelper.getTableRange(editor.document, i, TableFormatType.Normal);
            // フォーマット（Normal）
            if (!range.isEmpty) {
                var info = tableHelper.getTableInfo(editor.document, range, TableFormatType.Normal);
                var formatted = tableFormatter.getFormatTableText(editor.document, info, TableFormatType.Normal);
                edit.replace(info.range, formatted);

                // フォーマット済み範囲を積んでおく（偶数がstart、奇数がend）
                rangeLines.push(range.start.line);
                rangeLines.push(range.end.line);

                normalNum++;
                i = info.range.end.line + 1;
            }
            else {
                // SimpleTableの候補行を積んでおく
                if (tableHelper.isTableLine(editor.document.lineAt(i), TableLineFlag.SimpleSeparator)) {
                    targetLines.push(i);
                }
            }
        }

        var endLine = -1;
        var checkedIndex = 0;
        for (var i = 0; i < targetLines.length; i++) {
            var line = targetLines[i];
            if (line <= endLine) continue;

            // フォーマット済み範囲を走査しフォーマット対象の範囲を決める
            var min = (rangeLines.length > 0) ? rangeLines[rangeLines.length - 1] + 1 : 0
            var cnt = editor.document.lineCount - min;
            for (var j = checkedIndex; j < rangeLines.length; j++) {
                // 行が通り越したら
                if (line < rangeLines[j]) {
                    // 偶数行（start）
                    if (j % 2 == 0) {
                        // フォーマット済み範囲間なので範囲を設定
                        min = (j == 0) ? 0 : rangeLines[j - 1] + 1;
                        cnt = rangeLines[j] - min;
                        checkedIndex = j;
                    }
                    // 奇数行（end）
                    else {
                        // フォーマット済み範囲内なので無視する
                        min = 0;
                        cnt = 0;
                    }
                    break;
                }
            }

            // 範囲の取得（Simple）
            var range = tableHelper.getTableRange(editor.document, line, TableFormatType.Simple, min, cnt);
            // フォーマット（Simple）
            if (!range.isEmpty) {
                var info = tableHelper.getTableInfo(editor.document, range, TableFormatType.Simple);
                var formatted = tableFormatter.getFormatTableText(editor.document, info, TableFormatType.Simple);
                edit.replace(info.range, formatted);

                simpleNum++;
                endLine = info.range.end.line;
            }
        }

        if (normalNum + simpleNum > 0) {
            console.log("Table: Formatting succeeded!", "total: " + (normalNum + simpleNum), "(normal: " + normalNum, "simple: " + simpleNum + ")");
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
