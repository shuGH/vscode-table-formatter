'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, CellInfo, TableInfo, TableHelper } from './helper';

var utilPad = require('utils-pad-string')
var strWidth = require('string-width')
var trim = require('trim')

export class TableFormatter {

    constructor() {
    }

    dispose() {
    }

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
                // Markdown ----------------
                case CellType.MD_NormalSeparator:
                case CellType.MD_LeftSeparator:
                    size += cellInfo.padding;
                    formatted += (i == 0 || size == 0) ? "" : " ";
                    formatted += utilPad(trimed, size, { rpad: "-" });
                    formatted += (i == 0) ? "|" : " |";
                    break;    
                case CellType.MD_RightSeparator:
                    size += cellInfo.padding;
                    formatted += (i == 0 || size == 0) ? "" : " ";
                    formatted += utilPad(trimed, size, { lpad: "-" });
                    formatted += (i == 0) ? "|" : " |";
                    break;    
                case CellType.MD_CenterSeparator:
                    size += cellInfo.padding;
                    formatted += (i == 0 || size == 0) ? "" : " ";
                    formatted += utilPad(":", size - 1, { rpad: "-" }) + ":";
                    formatted += (i == 0) ? "|" : " |";
                    break;    

                // Textile ----------------
                case CellType.TT_HeaderPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "_." : "_. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += (i == 0) ? "|" : " |";
                    break;    
                case CellType.TT_LeftPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "<." : "<. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += (i == 0) ? "|" : " |";
                    break;    
                case CellType.TT_RightPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? ">." : ">. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += (i == 0) ? "|" : " |";
                    break;    
                case CellType.TT_CenterPrefix:
                    trimed = trim(trimed.substring(2));
                    formatted += (i == 0) ? "" : (size == 0) ? "=." : "=. ";
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += (i == 0) ? "|" : " |";
                    break;    

                // Etc ----------------
                default:
                    formatted += (i == 0 || size == 0) ? "" : " ";
                    formatted += utilPad("", cellInfo.padding);
                    formatted += this.getAlignedText(trimed, size, cellInfo.align);
                    formatted += (i == 0) ? "|" : " |";
                    break;    
            }
        })
        return formatted;
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
}
