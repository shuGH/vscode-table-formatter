'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, DelimiterType, TableEdgesType, CellInfo, TableInfo, TableProperty } from './table';
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
            formatted += this.getFormattedLineText(i, info.property, row, maxList, formatType);
            if (line != info.range.end.line) formatted += '\n';
        });
        return formatted;
    }

    // フォーマットするサイズを取得
    private getFormattingSize(cellIndex: number, cellInfo: CellInfo, maxCount: number, cellCount: number, isMarkdown: boolean, isPutOneSpace: boolean, isPutEdges: boolean): number {
        // utilPad()がlength基準で処理されるので、差分から長さを修正
        let size = maxCount - cellInfo.diff;

        switch (cellInfo.type) {
            case CellType.CM_MinusSeparator:
            case CellType.CM_EquallSeparator:
                size += cellInfo.padding;
                // コンフィグ：セパレータの左右をパディングする場合
                if (this.settings.markdown.oneSpacePadding) {
                    size += (cellInfo.delimiter == DelimiterType.Plus) ? 2 : 0;
                }
                else {
                    size += (cellInfo.delimiter == DelimiterType.Plus || cellInfo.delimiter == DelimiterType.Pipe) ? 2 : 0;
                }

                // コンフィグ：テーブル両端のデリミタをなくす場合
                if (!isPutEdges && !isPutOneSpace) {
                    // ２セル目か末尾セル（先頭セルは必ず空白）
                    if (cellIndex == 1) {
                        size -= 1;
                    }
                    else if (cellIndex == cellCount - 1) {
                        size -= 1;
                    }
                }
                break;

            case CellType.MD_LeftSeparator:
            case CellType.MD_RightSeparator:
            case CellType.MD_CenterSeparator:
                size += cellInfo.padding;
                // コンフィグ：セパレータの左右をパディングする場合
                if (!this.settings.markdown.oneSpacePadding) {
                    size += 2;
                }

                // コンフィグ：テーブル両端のデリミタをなくす場合
                if (!isPutEdges && !isPutOneSpace) {
                    // ２セル目か末尾セル（先頭セルは必ず空白）
                    if (cellIndex == 1) {
                        size -= 1;
                    }
                    else if (cellIndex == cellCount - 1) {
                        size -= 1;
                    }
                }
                break;
        }

        return size;
    }

    // デリミタの取得
    private getDelimiter(cellIndex: number, cellInfo: CellInfo, cellCount: number, isMarkdown: boolean, isPutOneSpace: boolean, isPutEdges: boolean): number {
        // マークダウンでないときはそのまま返す（isPutEdgesがtrueのときはMarkdown確定のはずだが念のため）
        if (!isMarkdown) return cellInfo.delimiter;
        // コンフィグ：通常通りテーブル両端を表示する場合そのまま返す
        if (isPutEdges) return cellInfo.delimiter;

        let delimiter = cellInfo.delimiter;
        switch (cellInfo.type) {
            case CellType.CM_MinusSeparator:
            case CellType.CM_EquallSeparator:
            case CellType.MD_LeftSeparator:
            case CellType.MD_RightSeparator:
            case CellType.MD_CenterSeparator:
                // コンフィグ：テーブル両端のデリミタをなくす場合
                if (cellIndex == cellCount - 1) {
                    delimiter = DelimiterType.None;
                }
                break;

            case CellType.CM_Blank:
            case CellType.CM_Content:
                // コンフィグ：テーブル両端のデリミタをなくす場合
                if (cellIndex == 0) {
                    delimiter = DelimiterType.None;
                }
                else if (cellIndex == cellCount - 1) {
                    delimiter = DelimiterType.None;
                }
                break;
        }
        return delimiter;
    }

    // 揃え向きを返す
    private getAlign(cellIndex: number, cellInfo: CellInfo, rowIndex: number, prop: TableProperty, formatType: TableFormatType): number {
        // コンフィグ：強制揃えしない場合はそのまま返す
        if (!this.settings.common.centerAlignedHeader && !this.settings.common.rightAlignedNumeric) return cellInfo.align

        let align = cellInfo.align;

        // コンフィグ：ヘッダーを中心揃えにする
        if (this.settings.common.centerAlignedHeader) {
            switch (cellInfo.type) {
                case CellType.TT_HeaderPrefix:
                    align = CellAlign.Center;
                    break;

                case CellType.CM_Content:
                    if (formatType == TableFormatType.Normal) {
                        if (prop.markdownTableHeaderIndexes.has(rowIndex) || prop.gridTableHeaderIndexes.has(rowIndex)) {
                            align = CellAlign.Center;
                        }
                    }
                    else if (formatType == TableFormatType.Simple) {
                        if (prop.simpleTableHeaderIndexes.has(rowIndex)) {
                            align = CellAlign.Center;
                        }
                    }
                    break;
            }
        }

        // コンフィグ：数字セルを中心揃えにする（揃えが設定されておらず、ヘッダーでない場合のみ有効）
        if (this.settings.common.rightAlignedNumeric && cellInfo.align == CellAlign.None) {
            switch (cellInfo.type) {
                case CellType.CM_Content:
                    if (formatType == TableFormatType.Normal) {
                        if (cellInfo.isNumeric &&
                            !prop.markdownTableHeaderIndexes.has(rowIndex) && !prop.gridTableHeaderIndexes.has(rowIndex)) {
                            align = CellAlign.Right;
                        }
                    }
                    else if (formatType == TableFormatType.Simple) {
                        if (cellInfo.isNumeric &&
                            !prop.simpleTableHeaderIndexes.has(rowIndex)) {
                            align = CellAlign.Right;
                        }
                    }
                    break;
            }
        }

        return align;
    }

    private getIsPutPaddingOneSpace(cellIndex: number, isPutEdges: boolean, defaultOut: boolean): boolean {
        // 通常通りテーブルの両端にセパレータを表示する場合はそのまま返す
        if (isPutEdges) return defaultOut;

        // コンフィグ：ボーターレスの場合で２セル目（先頭セルは空白）なら詰めるためにfalseを返す
        if (cellIndex == 1) {
            return false;
        }
        return defaultOut;
    }

    private getIsPutOneSpace(prop: TableProperty): boolean {
        return this.settings.markdown.oneSpacePadding;
    }

    private getIsPutEdges(prop: TableProperty): boolean {
        // マークダウン以外は無視
        if (!prop.isMarkdown) return true;

        let edgesType = this.settings.markdown.tableEdgesType;
        if (edgesType == TableEdgesType.Auto) {
            edgesType = (prop.hasDelimiterAtLineHead) ? TableEdgesType.Normal : TableEdgesType.Borderless;
        }

        switch (edgesType) {
            case TableEdgesType.Normal:
                return true;
            case TableEdgesType.Borderless:
                return false;
        }
        return false;
    }

    // 行のフォーマット済みの文字列を返す
    private getFormattedLineText(rowIndex: number, prop: TableProperty, cellInfoList: Array<CellInfo>, maxlist: Array<number>, formatType: TableFormatType, option?: any): string {
        if (cellInfoList && maxlist && cellInfoList.length != maxlist.length) return "";

        // 行全体のフォーマット設定
        let isPutOneSpace = this.getIsPutOneSpace(prop);
        let isPutEdges = this.getIsPutEdges(prop);

        var formatted = "";
        var cellCount = maxlist.length;
        maxlist.forEach((maxCount, i) => {
            var cellInfo = cellInfoList[i];

            // 各セルのフォーマット設定
            let formattingSize = this.getFormattingSize(i, cellInfo, maxCount, cellCount, prop.isMarkdown, isPutOneSpace, isPutEdges);
            let delimiter = this.getDelimiter(i, cellInfo, cellCount, prop.isMarkdown, isPutOneSpace, isPutEdges);
            let align = this.getAlign(i, cellInfo, rowIndex, prop, formatType);

            let isPutPaddingOneSpace = false;

            switch (cellInfo.type) {
                // Common ----------------
                case CellType.CM_MinusSeparator:
                    isPutPaddingOneSpace = this.getIsPutPaddingOneSpace(i, isPutEdges, isPutOneSpace);
                    formatted += this.getPaddingText(i, formattingSize, 0, delimiter, isPutPaddingOneSpace);
                    formatted += this.getAlignedText("", formattingSize, "-", CellAlign.Center);
                    formatted += this.getDelimiterText(i, cellInfoList.length, delimiter, isPutOneSpace);
                    break;

                case CellType.CM_EquallSeparator:
                    isPutPaddingOneSpace = this.getIsPutPaddingOneSpace(i, isPutEdges, isPutOneSpace);
                    formatted += this.getPaddingText(i, formattingSize, 0, delimiter, isPutPaddingOneSpace);
                    formatted += this.getAlignedText("", formattingSize, "=", CellAlign.Center);
                    formatted += this.getDelimiterText(i, cellInfoList.length, delimiter, isPutOneSpace);
                    break;

                // Markdown ----------------
                case CellType.MD_LeftSeparator:
                    isPutPaddingOneSpace = this.getIsPutPaddingOneSpace(i, isPutEdges, isPutOneSpace);
                    formatted += this.getPaddingText(i, formattingSize, 0, delimiter, isPutPaddingOneSpace);
                    formatted += this.getAlignedText(":---", formattingSize, "-", CellAlign.None);
                    formatted += this.getDelimiterText(i, cellInfoList.length, delimiter, isPutOneSpace);
                    break;

                case CellType.MD_RightSeparator:
                    isPutPaddingOneSpace = this.getIsPutPaddingOneSpace(i, isPutEdges, isPutOneSpace);
                    formatted += this.getPaddingText(i, formattingSize, 0, delimiter, isPutPaddingOneSpace);
                    formatted += this.getAlignedText("---:", formattingSize, "-", CellAlign.Right);
                    formatted += this.getDelimiterText(i, cellInfoList.length, delimiter, isPutOneSpace);
                    break;

                case CellType.MD_CenterSeparator:
                    isPutPaddingOneSpace = this.getIsPutPaddingOneSpace(i, isPutEdges, isPutOneSpace);
                    formatted += this.getPaddingText(i, formattingSize, 0, delimiter, isPutPaddingOneSpace);
                    formatted += ":" + this.getAlignedText("", formattingSize - 2, "-", CellAlign.Center) + ":";
                    formatted += this.getDelimiterText(i, cellInfoList.length, delimiter, isPutOneSpace);
                    break;

                // Textile ----------------
                case CellType.TT_HeaderPrefix:
                    formatted += (i == 0) ? "" : (formattingSize == 0) ? "_." : "_. ";
                    formatted += this.getAlignedText(cellInfo.string, formattingSize, " ", align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_LeftPrefix:
                    formatted += (i == 0) ? "" : (formattingSize == 0) ? "<." : "<. ";
                    formatted += this.getAlignedText(cellInfo.string, formattingSize, " ", CellAlign.Left);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_RightPrefix:
                    formatted += (i == 0) ? "" : (formattingSize == 0) ? ">." : ">. ";
                    formatted += this.getAlignedText(cellInfo.string, formattingSize, " ", CellAlign.Right);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;
                case CellType.TT_CenterPrefix:
                    formatted += (i == 0) ? "" : (formattingSize == 0) ? "=." : "=. ";
                    formatted += this.getAlignedText(cellInfo.string, formattingSize, " ", CellAlign.Center);
                    formatted += this.getDelimiterText(i, cellInfoList.length, cellInfo.delimiter);
                    break;

                // 空白、文字列 ----------------
                case CellType.CM_Blank:
                case CellType.CM_Content:
                    isPutPaddingOneSpace = this.getIsPutPaddingOneSpace(i, isPutEdges, true);
                    formatted += this.getPaddingText(i, formattingSize, cellInfo.padding, delimiter, isPutPaddingOneSpace);
                    formatted += this.getAlignedText(cellInfo.string, formattingSize, " ", align);
                    formatted += this.getDelimiterText(i, cellInfoList.length, delimiter);
                    break;
            }
        })

        // コンフィグ：末尾スペースを削除する
        if (this.settings.common.trimTrailingWhitespace) {
            formatted = trim.right(formatted);
        }

        return formatted;
    }

    private getPaddingText(cellIndex: number, size: number, padding: number, delimiter: DelimiterType, isPutOneSpace: boolean = true): string {
        var spacer = "";
        switch (delimiter) {
            case DelimiterType.None:
                // 行の先頭セルか末尾セルしか来ないはず
                if (isPutOneSpace) {
                    spacer = (cellIndex == 0 || size == 0) ? "" : " ";
                }
                else {
                    spacer = "";
                }
                break;
            case DelimiterType.Pipe:
                if (isPutOneSpace) {
                    spacer = (cellIndex == 0 || size == 0) ? "" : " ";
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
            case CellAlign.None:
                // Leftとして処理
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

    private getDelimiterText(cellIndex: number, rowSize: number, delimiter: DelimiterType, isPutOneSpace: boolean = true): string {
        switch (delimiter) {
            case DelimiterType.None:
                // 行の先頭セルか末尾セルしか来ないはず
                if (isPutOneSpace) {
                    return (cellIndex == 0) ? "" : " ";
                }
                return "";
            case DelimiterType.Pipe:
                if (isPutOneSpace) {
                    return (cellIndex == 0) ? "|" : " |";
                }
                return "|";
            case DelimiterType.Plus:
                return "+";
            case DelimiterType.Space:
                // 言語仕様的に２スペース推奨らしい
                return (cellIndex == 0 || cellIndex == rowSize - 1) ? "" : "  ";
            // case DelimiterType.Comma:
            //     return (cell == 0 || cell == rowSize - 1) ? "" : ", ";
        }
        return "";
    }
}
