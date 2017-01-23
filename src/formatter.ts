'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, DelimiterType, CellInfo, TableInfo } from './table';
import { TableHelper } from './helper';

var utilPad = require('utils-pad-string')
var strWidth = require('string-width')
var trim = require('trim')

export class TableFormatter {

    constructor() {
    }

    dispose() {
    }

    // フォーマット済みの文字列を返す
    public getFormatTableText(doc: vscode.TextDocument, info: TableInfo, option?: any): string {
        if (!info.isValid()) return "";

        var formatted = "";
        var maxList = info.getMaxCellSizeList();
        info.cellGrid.forEach((row, i) => {
            var line = i + info.range.start.line;
            formatted += this.getFormattedLineText(doc.lineAt(line), row, maxList);
            if (line != info.range.end.line) formatted += '\n';
        });
        return formatted;
    }

    // 行のフォーマット済みの文字列を返す
    private getFormattedLineText(line: vscode.TextLine, cellInfoList: Array<CellInfo>, maxlist: Array<number>, option?: any): string {
        if (cellInfoList && maxlist && cellInfoList.length != maxlist.length) return "";

        var cells = line.text.split("|", -1);
        if (cells.length > 1 && trim(cells[0]) != "") {
            cells.unshift("");
        }

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
                    size += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter);
                    formatted += utilPad(trimed, size, { rpad: "-" });
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;
                case CellType.CM_EquallSeparator:
                    size += cellInfo.padding;
                    size += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter);
                    formatted += utilPad(trimed, size, { rpad: "=" });
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;

                // Markdown ----------------
                case CellType.MD_LeftSeparator:
                    size += cellInfo.padding;
                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter);
                    formatted += utilPad(trimed, size, { rpad: "-" });
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;
                case CellType.MD_RightSeparator:
                    size += cellInfo.padding;
                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter);
                    formatted += utilPad(trimed, size, { lpad: "-" });
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;
                case CellType.MD_CenterSeparator:
                    size += cellInfo.padding;
                    formatted += this.getPaddingText(i, size, 0, cellInfo.delimiter);
                    formatted += utilPad(":", size - 1, { rpad: "-" }) + ":";
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;

                // Textile ----------------
                case CellType.TT_HeaderPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "_." : "_. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;
                case CellType.TT_LeftPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "<." : "<. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;
                case CellType.TT_RightPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? ">." : ">. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;
                case CellType.TT_CenterPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "=." : "=. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;

                // Etc ----------------
                default:
                    formatted += this.getPaddingText(i, size, cellInfo.padding, cellInfo.delimiter);
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += this.getDelimiterText(i, cellInfo.delimiter);
                    break;
            }
        })
        return formatted;
    }

    private getPaddingText(line: number, size: number, padding: number, delimiter: DelimiterType): string {
        var str = "";
        switch (delimiter) {
            case DelimiterType.Pipe:
                str = (line == 0 || size == 0) ? "" : " ";
                break;
            case DelimiterType.Plus:
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

    private getDelimiterText(line: number, delimiter: DelimiterType): string {
        switch (delimiter) {
            case DelimiterType.Pipe:
                return (line == 0) ? "|" : " |";
            case DelimiterType.Plus:
                return "+";
        }
        return "";
    }
}
