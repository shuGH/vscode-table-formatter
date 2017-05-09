'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, DelimiterType, CellInfo, TableInfo } from './table';
import { TableHelper, TableFormatType } from './helper';

var utilPad = require('utils-pad-string')
var strWidth = require('string-width')
var trim = require('trim')

export class TableFormatter {

    constructor() {
    }

    dispose() {
    }

    // フォーマット済みの文字列を返す
    public getFormatTableText(doc: vscode.TextDocument, info: TableInfo, formatType: TableFormatType, option?: any): string {
        if (!info.isValid()) return "";

        var tableHelper = new TableHelper();
        
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

            switch (cellInfo.type) {
                // Common ----------------
                case CellType.CM_MinusSeparator:
                    size += cellInfo.padding;
                    size += (cellInfo.delimiter != DelimiterType.Space) ? 2 : 0;
                    formatted += utilPad(trimed, size, { rpad: "-" });
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, false);
                    break;
                case CellType.CM_EquallSeparator:
                    size += cellInfo.padding;
                    size += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter);
                    formatted += utilPad(trimed, size, { rpad: "=" });
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, true);
                    break;

                // Markdown ----------------
                case CellType.MD_LeftSeparator:
                    size += cellInfo.padding;
                    size += 2;
                    formatted += utilPad(trimed, size, { rpad: "-" });
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, false);
                    break;
                case CellType.MD_RightSeparator:
                    size += cellInfo.padding;
                    size += 2;
                    formatted += utilPad(trimed, size, { lpad: "-" });
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, false);
                    break;
                case CellType.MD_CenterSeparator:
                    size += cellInfo.padding;
                    size += 1;
                    formatted += utilPad(":", size, { rpad: "-" }) + ":";
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, false);
                    break;

                // Textile ----------------
                case CellType.TT_HeaderPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "_." : "_. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, true);
                    break;
                case CellType.TT_LeftPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "<." : "<. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, true);
                    break;
                case CellType.TT_RightPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? ">." : ">. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, true);
                    break;
                case CellType.TT_CenterPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "=." : "=. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, true);
                    break;

                // Etc ----------------
                default:
                    formatted += this.getPaddingText(i, size, cellInfo.padding, cellInfo.delimiter);
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter, true);
                    break;
            }
        })
        return formatted;
    }

    private getPaddingText(cell: number, size: number, padding: number, delimiter: DelimiterType): string {
        var str = "";
        switch (delimiter) {
            case DelimiterType.Pipe:
                str = (cell == 0 || size == 0) ? "" : " ";
                break;
            case DelimiterType.Plus:
                str = "";
                break;
            case DelimiterType.Space:
                str = "";
                break;
        }
        return str + utilPad("", padding);
    }

    private getAlignedText(text: string, size: number, align: CellAlign): string {
        var opt = {};
        switch (align) {
            case CellAlign.Left:
                opt = { rpad: " " };
                break;
            case CellAlign.Right:
                opt = { lpad: " " };
                break;
            case CellAlign.Center:
                opt = { lpad: " ", rpad: " " };
                break;
        }
        return utilPad(text, size, opt);
    }

    private getDelimiterText(cell: number, rowSize: number,delimiter: DelimiterType, rightPadding: boolean): string {
        switch (delimiter) {
            case DelimiterType.Pipe:
                return (cell == 0) ? "|" : (rightPadding ? " |" : "|");
            case DelimiterType.Plus:
                return "+";
            case DelimiterType.Space:
                // 2スペース推奨
                return (cell == 0 || cell == rowSize - 1) ? "" : "  ";
        }
        return "";
    }
}
