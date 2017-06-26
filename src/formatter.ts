'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, DelimiterType, CellInfo, TableInfo } from './table';
import { Setting, TableHelper, TableFormatType } from './helper';

var utilPad = require('utils-pad-string')
var strWidth = require('string-width')
var trim = require('trim')

export class TableFormatter {
    private settings: Setting;
    private tableHelper: TableHelper;

    constructor(config: Setting, helper: TableHelper) {
        // オブジェクトは参照渡し
        this.settings = config;
        this.tableHelper = helper;
    }

    dispose() {
    }

    // フォーマット済みの文字列を返す
    public getFormattedTableText(doc: vscode.TextDocument, info: TableInfo, formatType: TableFormatType, option?: any): string {
        if (!info.isValid()) return "";

        var formatted = "";
        var maxList = info.getMaxCellSizeList();
        info.cellGrid.forEach((row, i) => {
            var line = i + info.range.start.line;
            formatted += this.getFormattedLineText(row, maxList, formatType);
            if (line != info.range.end.line) formatted += '\n';
        });
        return formatted;
    }

    // 行のフォーマット済みの文字列を返す
    private getFormattedLineText(cellInfoList: Array<CellInfo>, maxlist: Array<number>, formatType: TableFormatType, option?: any): string {
        if (cellInfoList && maxlist && cellInfoList.length != maxlist.length) return "";

        var formatted = "";
        maxlist.forEach((elem, i) => {
            var cellInfo = cellInfoList[i];

            // utilPad()がlength基準で処理されるので、差分から長さを修正
            var formattedSize = elem - cellInfo.diff;
            let hasOneSpace = true;
            
            switch (cellInfo.type) {
                // Common ----------------
                case CellType.CM_MinusSeparator:
                    formattedSize += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        formattedSize += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                        hasOneSpace = true;
                    }
                    else {
                        formattedSize += (cellInfo.delimiter == DelimiterType.Plus || cellInfo.delimiter == DelimiterType.Pipe) ? 2 : 0;
                        hasOneSpace = false;
                    }
                    formatted += this.getPaddingText(i, formattedSize, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText("", formattedSize, "-", CellAlign.Center);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                case CellType.CM_EquallSeparator:
                    formattedSize += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        formattedSize += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                        hasOneSpace = true;
                    }
                    else {
                        formattedSize += (cellInfo.delimiter == DelimiterType.Plus || cellInfo.delimiter == DelimiterType.Pipe) ? 2 : 0;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, formattedSize, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText("", formattedSize, "=", CellAlign.Center);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                // Markdown ----------------
                case CellType.MD_LeftSeparator:
                    formattedSize += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        hasOneSpace = true;
                    }
                    else {
                        formattedSize += 2;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, formattedSize, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText(":---", formattedSize, "-", CellAlign.Left);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                case CellType.MD_RightSeparator:
                    formattedSize += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        hasOneSpace = true;
                    }
                    else {
                        formattedSize += 2;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, formattedSize, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += this.getAlignedText("---:", formattedSize, "-", CellAlign.Right);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                case CellType.MD_CenterSeparator:
                    formattedSize += cellInfo.padding;

                    // 左右に空白を設けるか
                    if (this.settings.markdown.oneSpacePadding) {
                        hasOneSpace = true;
                    }
                    else {
                        formattedSize += 2;
                        hasOneSpace = false;
                    }

                    formatted += this.getPaddingText(i, formattedSize, 0, cellInfo.delimiter, hasOneSpace);
                    formatted += ":" + this.getAlignedText("", formattedSize - 2, "-", CellAlign.Center) + ":";
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, hasOneSpace);
                    break;

                // Textile ----------------
                case CellType.TT_HeaderPrefix:
                    formatted += (i == 0) ? "" : (formattedSize == 0) ? "_." : "_. ";
                    formatted += this.getAlignedText(cellInfo.string, formattedSize, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_LeftPrefix:
                    formatted += (i == 0) ? "" : (formattedSize == 0) ? "<." : "<. ";
                    formatted += this.getAlignedText(cellInfo.string, formattedSize, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_RightPrefix:
                    formatted += (i == 0) ? "" : (formattedSize == 0) ? ">." : ">. ";
                    formatted += this.getAlignedText(cellInfo.string, formattedSize, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_CenterPrefix:
                    formatted += (i == 0) ? "" : (formattedSize == 0) ? "=." : "=. ";
                    formatted += this.getAlignedText(cellInfo.string, formattedSize, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;

                // Etc ----------------
                default:
                    formatted += this.getPaddingText(i, formattedSize, cellInfo.padding, cellInfo.delimiter);
                    formatted += this.getAlignedText(cellInfo.string, formattedSize, " ", cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
            }
        })

        // 末尾スペースを削除する
        if (this.settings.common.trimTrailingWhitespace) {
            formatted = trim.right(formatted);
        }

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
            // case DelimiterType.Comma:
            //     spacer = "";
            //     break;
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
            // case DelimiterType.Comma:
            //     return (cell == 0 || cell == rowSize - 1) ? "" : ", ";
        }
        return "";
    }
}
