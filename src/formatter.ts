'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, DelimiterType, CellInfo, TableInfo } from './table';
import { Setting, TableHelper, TableFormatType } from './helper';

var utilPad = require('utils-pad-string')
var strWidth = require('string-width')
var trim = require('trim')

export class TableFormatter {
    private settings: Setting;

    constructor(config: Setting) {
        // オブジェクトは参照渡し
        this.settings = config;
    }

    dispose() {
    }

    // フォーマット済みの文字列を返す
    public getFormatTableText(doc: vscode.TextDocument, info: TableInfo, formatType: TableFormatType, option?: any): string {
        if (!info.isValid()) return "";

        var tableHelper = new TableHelper(this.settings);

        var formatted = "";
        var maxList = info.getMaxCellSizeList();
        info.cellGrid.forEach((row, i) => {
            var line = i + info.range.start.line;

            formatted += this.getFormattedLineText(
                tableHelper.getSplitLineText(doc.lineAt(line).text, formatType).cells,
                row, maxList, formatType
            );

            if (line != info.range.end.line) formatted += '\n';
        });
        return formatted;
    }

    // 行のフォーマット済みの文字列を返す
    private getFormattedLineText(cells: Array<string>, cellInfoList: Array<CellInfo>, maxlist: Array<number>, formatType: TableFormatType, option?: any): string {
        if (cellInfoList && maxlist && cellInfoList.length != maxlist.length) return "";

        var formatted = "";
        maxlist.forEach((elem, i) => {
            var cellInfo = cellInfoList[i];

            var trimed = (i < cells.length) ? trim(cells[i]) : "";
            var sub = strWidth(trimed) - trimed.length;
            var size = (sub == 0) ? elem : elem - sub;
            let hasOneSpace: boolean = true;

            switch (cellInfo.type) {
                // Common ----------------
                case CellType.CM_MinusSeparator:
                    size += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        size += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                        hasOneSpace = true;
                    }
                    else {
                        size += (cellInfo.delimiter == DelimiterType.Plus || cellInfo.delimiter == DelimiterType.Pipe) ? 2 : 0;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText("", size, "-", CellAlign.Center);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                case CellType.CM_EquallSeparator:
                    size += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        size += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                        hasOneSpace = true;
                    }
                    else {
                        size += (cellInfo.delimiter == DelimiterType.Plus || cellInfo.delimiter == DelimiterType.Pipe) ? 2 : 0;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText("", size, "=", CellAlign.Center);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                // Markdown ----------------
                case CellType.MD_LeftSeparator:
                    size += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        hasOneSpace = true;
                    }
                    else {
                        size += 2;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText(":---", size, "-", CellAlign.Left);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                case CellType.MD_RightSeparator:
                    size += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        hasOneSpace = true;
                    }
                    else {
                        size += 2;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText("---:", size, "-", CellAlign.Right);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                case CellType.MD_CenterSeparator:
                    size += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        hasOneSpace = true;
                    }
                    else {
                        size += 2;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += ":" + this.getAlignedText("", size - 2, "-", CellAlign.Center) + ":";
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                // Textile ----------------
                case CellType.TT_HeaderPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "_." : "_. ";
                    formatted += this.getAlignedText(trimed, size, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_LeftPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "<." : "<. ";
                    formatted += this.getAlignedText(trimed, size, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_RightPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? ">." : ">. ";
                    formatted += this.getAlignedText(trimed, size, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_CenterPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "=." : "=. ";
                    formatted += this.getAlignedText(trimed, size, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;

                // Etc ----------------
                default:
                    formatted += this.getPaddingText(i, size, cellInfo.padding, cellInfo.delimiter);
                    formatted += this.getAlignedText(trimed, size, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
            }
        })
        return formatted;
    }

    private getPaddingText(cell: number, size: number, padding: number, delimiter: DelimiterType, hasOneSpace: boolean = true): string {
        var spacer = "";
        switch (delimiter) {
            case DelimiterType.Pipe:
                if (hasOneSpace) {
                    spacer = (cell == 0 || size == 0) ? "" : " ";
                }
                else {
                    spacer = "";
                }
                break;
            case DelimiterType.Plus:
                spacer = "";
                break;
            case DelimiterType.Space:
                spacer = "";
                break;
        }
        return spacer + utilPad("", padding);
    }

    private getAlignedText(text: string, size: number, pad: string, align: CellAlign): string {
        var opt = {};
        switch (align) {
            case CellAlign.Left:
                opt = { rpad: pad };
                break;
            case CellAlign.Right:
                opt = { lpad: pad };
                break;
            case CellAlign.Center:
                opt = { lpad: pad, rpad: pad };
                break;
        }
        return utilPad(text, size, opt);
    }

    private getDelimiterText(cell: number, rowSize: number, delimiter: DelimiterType, hasOneSpace:boolean = true): string {
        switch (delimiter) {
            case DelimiterType.Pipe:
                if (hasOneSpace) {
                    return (cell == 0) ? "|" : " |";
                }
                return "|";
            case DelimiterType.Plus:
                return "+";
            case DelimiterType.Space:
                // 2スペース推奨
                return (cell == 0 || cell == rowSize - 1) ? "" : "  ";
        }
        return "";
    }
}
