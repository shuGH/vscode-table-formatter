'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, DelimiterType, CellInfo, TableInfo } from './table';

var strWidth = require('string-width')
var trim = require('trim')

// Separator type
enum SeparatorType {
    None,
    Minus,
    Equall
};

export class TableHelper {

    constructor() {
    }

    dispose() {
    }

    // テーブル記法の行か
    public isTableLine(line: vscode.TextLine): boolean {
        if (line.isEmptyOrWhitespace) return false;
        // 行が"|"を含む、または行が+-=のみで構成されている
        // @TODO: SimpleTable用の判定
        return /\||^(?=.*?\+)[\-=+]+$/.test(line.text);
    }

    // 行の解析
    public getCellInfoList(line: vscode.TextLine): Array<CellInfo> {
        if (line.isEmptyOrWhitespace) return [];

        var list: Array<CellInfo> = [];
        var cells = [];
        var delimiter = DelimiterType.Pipe;

        // |がないときのみ、+で分ける
        if (line.text.indexOf('|') != -1) {
            cells = line.text.split("|", -1);
            delimiter = DelimiterType.Pipe;
        }
        else {
            cells = line.text.split("+", -1);
            delimiter = DelimiterType.Plus;
        }

        // 空白列を追加
        list.push(new CellInfo(line.firstNonWhitespaceCharacterIndex, delimiter));

        for (var i = 0; i < cells.length; i++) {
            var trimed = trim(cells[i]);

            // 最初の空白は追加済みなので無視する
            if (i == 0 && trimed == "") continue;
            // 最後の空白は追加せず無視する
            if (i == cells.length - 1 && trimed == "") continue;

            var size = strWidth(trimed);
            var type = (size == 0) ? CellType.CM_Blank : CellType.CM_Content;
            var align = CellAlign.Left;

            // Common  ----------------
            if (/^-+$/.test(trimed)) {
                type = CellType.CM_MinusSeparator;
                align = CellAlign.Left;
            }
            else if (/^=+$/.test(trimed)) {
                type = CellType.CM_EquallSeparator;
                align = CellAlign.Left;
            }
            // Markdown ----------------
            else if (/^:-+$/.test(trimed)) {
                type = CellType.MD_LeftSeparator;
                align = CellAlign.Left;
            }
            else if (/^-+:$/.test(trimed)) {
                type = CellType.MD_RightSeparator;
                align = CellAlign.Right;
            }
            else if (/^:-+:$/.test(trimed)) {
                type = CellType.MD_CenterSeparator;
                align = CellAlign.Center;
            }
            // Textile ----------------
            else if (/^_\./.test(trimed)) {
                size = strWidth(trim(trimed.substring(2)));
                type = CellType.TT_HeaderPrefix;
                align = CellAlign.Left;
            }
            else if (/^<\./.test(trimed)) {
                size = strWidth(trim(trimed.substring(2)));
                type = CellType.TT_LeftPrefix;
                align = CellAlign.Left;
            }
            else if (/^>\./.test(trimed)) {
                size = strWidth(trim(trimed.substring(2)));
                type = CellType.TT_RightPrefix;
                align = CellAlign.Right;
            }
            else if (/^=\./.test(trimed)) {
                size = strWidth(trim(trimed.substring(2)));
                type = CellType.TT_CenterPrefix;
                align = CellAlign.Center;
            }

            list.push(new CellInfo(size, delimiter, type, align));
        }
        return list;
    }

    // 表データの正規化
    private getNormalizedCellGrid(grid: Array<Array<CellInfo>>): Array<Array<CellInfo>> {
        // 全行のサイズを揃える
        var max = 0;
        grid.forEach(row => {
            max = Math.max(max, row.length);
        });
        grid.forEach(row => {
            // デリミタも揃える
            var delimiter = (row.length > 0) ? row[0].delimiter : DelimiterType.Pipe;
            for (var c = row.length; c < max; c++) {
                row.push(new CellInfo(0, delimiter));
            }
        });

        // セパレータタイプを確定する
        grid.forEach(row => {
            // セパレータ行かの判定
            var rowType = SeparatorType.None;
            for (var i = 0; i < row.length; i++) {
                var cell = row[i];
                // デリミタがPlusなら初期値をMinusにする（一応この時点でセパレータ行で確定ではあるが特に何もしない）
                if (i == 0 && cell.delimiter == DelimiterType.Plus) {
                    rowType = SeparatorType.Minus;
                }

                // 文字列なら非セパレータ行で確定
                if (cell.type == CellType.CM_Content) {
                    rowType = SeparatorType.None;
                    break;
                }

                // セルのタイプで判定
                if (cell.type == CellType.CM_MinusSeparator) {
                    rowType = SeparatorType.Minus;
                }
                else if (cell.type == CellType.CM_EquallSeparator) {
                    rowType = SeparatorType.Equall;
                }
                else if (cell.type == CellType.MD_LeftSeparator || cell.type == CellType.MD_RightSeparator || cell.type == CellType.MD_CenterSeparator) {
                    rowType = SeparatorType.Minus;
                }
            }

            // セパレータタイプを補正
            row.forEach((cell, i) => {
                // セパレータ行でない場合、セルタイプを文字列に（-や:-を文字として扱う）
                if (rowType == SeparatorType.None) {
                    if (cell.type == CellType.CM_MinusSeparator || cell.type == CellType.CM_EquallSeparator ||
                        cell.type == CellType.MD_LeftSeparator || cell.type == CellType.MD_RightSeparator || cell.type == CellType.MD_CenterSeparator) {
                        cell.setType(CellType.CM_Content);
                    }
                }
                // セパレータ行の場合、セルタイプが空白のものをセパレータに
                else {
                    if (i != 0 && cell.type == CellType.CM_Blank) {
                        switch (rowType) {
                            case SeparatorType.Minus:
                                cell.setType(CellType.CM_MinusSeparator);
                                break;
                            case SeparatorType.Equall:
                                cell.setType(CellType.CM_EquallSeparator);
                                break;
                        }
                    }
                }
            });
        });

        // Markdownのセパレータのサイズを設定
        grid.forEach(row => {
            row.forEach(cell => {
                if (cell.type == CellType.CM_MinusSeparator ||
                    cell.type == CellType.MD_LeftSeparator || cell.type == CellType.MD_RightSeparator || cell.type == CellType.MD_CenterSeparator) {
                    // 最小である3文字にする
                    cell.setSize(3);
                }
            });
        });

        // Textileのサイズを設定
        grid.forEach(row => {
            // プレフィックス分のパディングを他の行の同列に設定する
            row.forEach((cell, i) => {
                if (cell.type == CellType.TT_HeaderPrefix || cell.type == CellType.TT_LeftPrefix || cell.type == CellType.TT_RightPrefix || cell.type == CellType.TT_CenterPrefix) {
                    grid.forEach(elem => {
                        if (i < elem.length) {
                            elem[i].setPadding(2);
                        }
                    });
                }
            });
        });

        // Markdownの位置揃え
        for (var r = grid.length - 1; r >= 0; r--) {
            var row = grid[r];
            // 各列の位置揃えを変更する
            row.forEach((cell, c) => {
                switch (cell.type) {
                    case CellType.MD_LeftSeparator:
                        grid.forEach(elem => {
                            if (c < elem.length) {
                                elem[c].setAlign(CellAlign.Left);
                            }
                        });
                        break;
                    case CellType.MD_RightSeparator:
                        grid.forEach(elem => {
                            if (c < elem.length) {
                                elem[c].setAlign(CellAlign.Right);
                            }
                        });
                        break;
                    case CellType.MD_CenterSeparator:
                        grid.forEach(elem => {
                            if (c < elem.length) {
                                elem[c].setAlign(CellAlign.Center);
                            }
                        });
                        break;
                }
            });
        }

        // Textileの位置揃え
        grid.forEach(row => {
            // 各セルの位置揃えを変更する
            row.forEach(cell => {
                switch (cell.type) {
                    case CellType.TT_LeftPrefix:
                        cell.setAlign(CellAlign.Left)
                        break;
                    case CellType.TT_RightPrefix:
                        cell.setAlign(CellAlign.Right)
                        break;
                    case CellType.TT_CenterPrefix:
                        cell.setAlign(CellAlign.Center)
                        break;
                }
            });
        });

        return grid;
    }

    // 表データの取得
    public getTableInfo(doc: vscode.TextDocument, line: number): TableInfo {
        // 後方に操作し開始行を取得
        var startLine = line;
        for (var i = line; i >= 0; i--) {
            if (!this.isTableLine(doc.lineAt(i))) break;
            startLine = i;
        }

        // 前方に操作し終了行を取得
        var endLine = line;
        for (var i = line + 1; i < doc.lineCount; i++) {
            if (!this.isTableLine(doc.lineAt(i))) break;
            endLine = i;
        }

        // 各行の解析
        var grid: Array<Array<CellInfo>> = [];
        for (var i = startLine; i <= endLine; i++) {
            grid.push(this.getCellInfoList(doc.lineAt(i)));
        }

        return new TableInfo(
            new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(endLine, doc.lineAt(endLine).range.end.character)
            ),
            this.getNormalizedCellGrid(grid)
        );
    }
}
