'use strict';

import * as vscode from 'vscode';
import { CellType, CellAlign, DelimiterType, TableEdgesType, CellInfo, TableInfo } from './table';

var strWidth = require('string-width')
var trim = require('trim')

// 設定
export interface Setting {
    markdown: {
        oneSpacePadding: boolean,
        tableEdgesType: TableEdgesType
    },
    common: {
        explicitFullwidthChars: RegExp[],
        trimTrailingWhitespace: boolean,
        centerAlignedHeader: boolean,
        rightAlignNumericColumns: boolean,
        rightAlignedNumeric: boolean
    }
};

// Table format type
export enum TableFormatType {
    // separate with pipe table
    Normal,
    // rest simple table
    Simple,
    // CSV
    // Csv
};

// Table line
export enum TableLineFlag {
    None = 0,
    HasPipe = 1,
    PlusSeparator = 2,
    SimpleSeparator = 4,
    Comma = 8,
    NotEmpty = 16
};

// ヘルパークラス
export class TableHelper {
    private settings: Setting;

    // 正規表現オブジェクトのキャッシュ
    private regExpMap: { [key: string]: RegExp; };

    // デリミタの正規表現オブジェクト
    private pipeRegExp: RegExp;
    private plusSepRegExp: RegExp;
    private simpleSepRegExp: RegExp;
    private commaRegExp: RegExp;

    // セパレータの正規表現オブジェクト
    private commonMinusRegExp: RegExp;
    private commonEqualRegExp: RegExp;
    private markdownLeftRegExp: RegExp;
    private markdownRightRegExp: RegExp;
    private markdownCenterRegExp: RegExp;
    private textileHeaderRegExp: RegExp;
    private textileLeftRegExp: RegExp;
    private textileRightRegExp: RegExp;
    private textileCenterRegExp: RegExp;

    constructor(config: Setting) {
        // オブジェクトは参照渡し
        this.settings = config;

        // キャッシュ
        this.regExpMap = {};

        // "|"を含む
        this.pipeRegExp = /\|/;
        // +-=のみで構成されている
        this.plusSepRegExp = /^(?=.*?\+)[\-=+]+$/;
        // -のみまたは=のみで構成されている
        this.simpleSepRegExp = /^[\- ]+$|^[= ]+$/;
        // ,を含む
        this.commaRegExp = /,/;

        // Common
        this.commonMinusRegExp = /^-+$/;
        this.commonEqualRegExp = /^=+$/;
        // Markdown
        this.markdownLeftRegExp = /^:-+$/;
        this.markdownRightRegExp = /^-+:$/;
        this.markdownCenterRegExp = /^:-+:$/;
        // Textile
        this.textileHeaderRegExp = /^_\./;
        this.textileLeftRegExp = /^<\./;
        this.textileRightRegExp = /^>\./;
        this.textileCenterRegExp = /^=\./;
    }

    dispose() {
    }

    // テーブル記法の行か
    public isTableLine(line: vscode.TextLine, flag: TableLineFlag): boolean {
        if (line.isEmptyOrWhitespace) return false;

        if (flag & TableLineFlag.HasPipe) {
            // 行が"|"を含む
            if (this.pipeRegExp.test(line.text)) return true;
        }
        if (flag & TableLineFlag.PlusSeparator) {
            // 行が+-=のみで構成されている
            if (this.plusSepRegExp.test(line.text)) return true;
        }
        if (flag & TableLineFlag.SimpleSeparator) {
            // 行が-のみまたは=のみで構成されている
            if (this.simpleSepRegExp.test(line.text)) return true;
        }
        if (flag & TableLineFlag.Comma) {
            // 行が,を含む
            if (this.commaRegExp.test(line.text)) return true;
        }
        if (flag & TableLineFlag.NotEmpty) {
            // 行が空でない
            if (!line.isEmptyOrWhitespace) return true;
        }

        return false;
    }

    // Tableの範囲取得
    public getTableRange(doc: vscode.TextDocument, line: number, formatType: TableFormatType, minLine: number = 0, maxCount: number = -1): vscode.Range {
        var startLine = line;
        var endLine = line;

        if (maxCount < 0) maxCount = doc.lineCount - minLine;

        switch (formatType) {
            // ----------------
            case TableFormatType.Normal:
                // 現在の行を判定
                if (this.isTableLine(doc.lineAt(line), TableLineFlag.HasPipe | TableLineFlag.PlusSeparator)) {
                    // 後方に操作し開始行を取得
                    for (var i = line - 1; i >= minLine; i--) {
                        if (!this.isTableLine(doc.lineAt(i), TableLineFlag.HasPipe | TableLineFlag.PlusSeparator)) break;
                        startLine = i;
                    }

                    // 前方に操作し終了行を取得
                    for (var i = line + 1; i < minLine + maxCount; i++) {
                        if (!this.isTableLine(doc.lineAt(i), TableLineFlag.HasPipe | TableLineFlag.PlusSeparator)) break;
                        endLine = i;
                    }
                }
                break;

            // ----------------
            case TableFormatType.Simple:
                var hasSeparator = false;

                // 現在の行を判定
                if (this.isTableLine(doc.lineAt(line), TableLineFlag.NotEmpty)) {
                    // 後方に操作し開始行を取得（空白行またドキュメント始まり、セパレーター行の構成を探す）
                    for (var i = line - 1; i >= minLine - 1; i--) {
                        if (i == minLine -1 || !this.isTableLine(doc.lineAt(i), TableLineFlag.NotEmpty)) {
                            if (i + 1 < minLine + maxCount && this.isTableLine(doc.lineAt(i + 1), TableLineFlag.SimpleSeparator)) {
                                startLine = i + 1;
                                hasSeparator = true;
                            }
                            break;
                        }
                    }

                    // 前方に操作し終了行を取得（セパレーター行、空白行またはドキュメント終わりの構成を探す）
                    if (hasSeparator) {
                        hasSeparator = false;
                        for (var i = line + 1; i < minLine + maxCount + 1; i++) {
                            if (i == minLine + maxCount || !this.isTableLine(doc.lineAt(i), TableLineFlag.NotEmpty)) {
                                if (i - 1 >= minLine && this.isTableLine(doc.lineAt(i - 1), TableLineFlag.SimpleSeparator)) {
                                    endLine = i - 1;
                                    hasSeparator = true;
                                }
                                break;
                            }
                        }
                    }
                }

                // 正しいセパレーター行がない場合は初期化
                if (!hasSeparator) {
                    startLine = line;
                    endLine = line;
                }
                break;

            // ----------------
            // case TableFormatType.Csv:
            //     // 現在の行を判定
            //     if (this.isTableLine(doc.lineAt(line), TableLineFlag.Comma)) {
            //         // 後方に操作し開始行を取得
            //         for (var i = line - 1; i >= minLine; i--) {
            //             if (!this.isTableLine(doc.lineAt(i), TableLineFlag.Comma)) break;
            //             startLine = i;
            //         }

            //         // 前方に操作し終了行を取得
            //         for (var i = line + 1; i < minLine + maxCount; i++) {
            //             if (!this.isTableLine(doc.lineAt(i), TableLineFlag.Comma)) break;
            //             endLine = i;
            //         }
            //     }
            //     break;
        }

        // 複数列にヒットしない場合はisEmptyに引っかかるように0にする
        var endChar = (startLine == endLine) ? 0 : doc.lineAt(endLine).range.end.character;
        return new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(endLine, endChar)
        );
    }

    // 行の文字列を分割する（必ず先頭が空白で末尾は空白でないようにして返す）
    public getSplittedLineText(text: string, formatType: TableFormatType): { cells: Array<string>, delimiter: DelimiterType, isAddedBlankHead: boolean } {
        var cells = [];
        var delimiter = DelimiterType.Pipe;

        switch (formatType) {
            case TableFormatType.Normal:
                // | で分割
                if (text.indexOf('|') != -1) {
                    // 末尾の空白も含めるため -1
                    cells = text.split("|", -1);
                    delimiter = DelimiterType.Pipe;
                }
                // なければ + で分ける
                else {
                    // 末尾の空白も含めるため -1
                    cells = text.split("+", -1);
                    delimiter = DelimiterType.Plus;
                }
                break;
            case TableFormatType.Simple:
                cells = this.getSplittedTextByRegExp(text, " ");
                // @TODO: CSV対応したらSimpleの動作確認もする
                // console.log(JSON.stringify(cells));
                delimiter = DelimiterType.Space;
                break;
            // case TableFormatType.Csv:
            //     cells = this.getSplittedTextByRegExp(text, ",");
            //     delimiter = DelimiterType.Comma;
            //     break;
        }

        // 先頭要素が空白でない場合、空白要素の追加
        var isAdded = false;
        if (cells.length >= 1 && trim(cells[0]) != "") {
            cells.unshift("");
            isAdded = true;
        }

        // 末尾要素が空白の場合、削除
        if (cells.length >= 1 && trim(cells[cells.length - 1]) == "") {
            cells.pop();
        }

        return { cells: cells, delimiter: delimiter, isAddedBlankHead: isAdded };
    }

    // 正規表現を使って区切った文字列を返す
    public getSplittedTextByRegExp(text: string, delimiter: string): Array<string> {
        if (!this.regExpMap[delimiter]) {
            // デリミタで区切る（""か''で囲まれた範囲の空白は無視する）
            // @TODO: CSV対応
            this.regExpMap[delimiter] = new RegExp("('[^']*'|\"[^\"]*\")|[^" + delimiter + "]+", "g");
        }
        return text.match(this.regExpMap[delimiter]);
    }

    // 行の解析
    public getCellInfoList(line: vscode.TextLine, formatType: TableFormatType): { list: Array<CellInfo>, isAddedBlankHead: boolean } {
        if (line.isEmptyOrWhitespace) return { list: [], isAddedBlankHead: false };

        var obj = this.getSplittedLineText(line.text, formatType);

        var list: Array<CellInfo> = [];
        var cells = obj.cells;

        // 先頭は必ず空白になっており、もともとのオフセット分数の空白文字のセルを追加
        let spaces = Array(line.firstNonWhitespaceCharacterIndex + 1).join(" ");
        list.push(new CellInfo(this.settings, spaces, obj.delimiter));

        for (var i = 0; i < cells.length; i++) {
            var trimmed = trim(cells[i]);

            // 先頭の空白は追加済みなので無視する
            if (i == 0) continue;

            var type = (trimmed.length == 0) ? CellType.CM_Blank : CellType.CM_Content;
            var align = CellAlign.None;

            switch (formatType) {
                case TableFormatType.Normal:
                    // Common  ----------------
                    if (this.commonMinusRegExp.test(trimmed)) {
                        type = CellType.CM_MinusSeparator;
                        align = CellAlign.None;
                    }
                    else if (this.commonEqualRegExp.test(trimmed)) {
                        type = CellType.CM_EquallSeparator;
                        align = CellAlign.None;
                    }
                    // Markdown ----------------
                    else if (this.markdownLeftRegExp.test(trimmed)) {
                        type = CellType.MD_LeftSeparator;
                        align = CellAlign.Left;
                    }
                    else if (this.markdownRightRegExp.test(trimmed)) {
                        type = CellType.MD_RightSeparator;
                        align = CellAlign.Right;
                    }
                    else if (this.markdownCenterRegExp.test(trimmed)) {
                        type = CellType.MD_CenterSeparator;
                        align = CellAlign.Center;
                    }
                    // Textile ----------------
                    else if (this.textileHeaderRegExp.test(trimmed)) {
                        // ._を削除
                        trimmed = trim(trimmed.substring(2));
                        type = CellType.TT_HeaderPrefix;
                        align = CellAlign.None;
                    }
                    else if (this.textileLeftRegExp.test(trimmed)) {
                        // <_を削除
                        trimmed = trim(trimmed.substring(2));
                        type = CellType.TT_LeftPrefix;
                        align = CellAlign.Left;
                    }
                    else if (this.textileRightRegExp.test(trimmed)) {
                        // >_を削除
                        trimmed = trim(trimmed.substring(2));
                        type = CellType.TT_RightPrefix;
                        align = CellAlign.Right;
                    }
                    else if (this.textileCenterRegExp.test(trimmed)) {
                        // =_を削除
                        trimmed = trim(trimmed.substring(2));
                        type = CellType.TT_CenterPrefix;
                        align = CellAlign.Center;
                    }
                    break;

                case TableFormatType.Simple:
                    // Common  ----------------
                    if (this.commonMinusRegExp.test(trimmed)) {
                        type = CellType.CM_MinusSeparator;
                        align = CellAlign.None;
                    }
                    else if (this.commonEqualRegExp.test(trimmed)) {
                        type = CellType.CM_EquallSeparator;
                        align = CellAlign.None;
                    }
                    break;

                // case TableFormatType.Csv:
                //     // NOP ----------------
                //     break;
            }

            list.push(new CellInfo(this.settings, trimmed, obj.delimiter, type, align));
        }

        return { list: list, isAddedBlankHead: obj.isAddedBlankHead };
    }

    // 表データの取得
    public getTableInfo(doc: vscode.TextDocument, range: vscode.Range, formatType: TableFormatType): TableInfo {
        // 各行の解析
        var grid: Array<Array<CellInfo>> = [];
        var info = {
            // 行頭にデリミタがあったか
            hasDelimiterAtLineHead: false
        }
        for (var i = range.start.line; i <= range.end.line; i++) {
            var obj = this.getCellInfoList(doc.lineAt(i), formatType);
            grid.push(obj.list);
            // 一行でも先頭に空白を追加していなかったら、行頭デリミタがあったと判定
            if (!obj.isAddedBlankHead) info.hasDelimiterAtLineHead = true;
        }
        if(this.settings.common.rightAlignNumericColumns)
        {
            this.AdjustNumericColumns(grid, info.hasDelimiterAtLineHead);
        }
        return new TableInfo(this.settings, range, grid, info);
    }

    public AdjustNumericColumns(grid: Array<Array<CellInfo>>, hasDelimiterAtLineHead: boolean)
    {
        var isNumericColumnVector: Array<boolean> = [];
        var startedContentCells = false;
        var breakIteration = false;

        //detect numeric columns
        for (var i = grid.length - 1; i >= 0; i--) {
            if(breakIteration) break;
            var line = grid[i];
            for(var j = 0, rowLen = line.length; j < rowLen; j++) {
                var cell = line[j];
                //add initial values into isNumericColumnVector
                if(!(j in isNumericColumnVector)) {
                    isNumericColumnVector[j] = cell.type == CellType.CM_Content || cell.type == CellType.CM_Blank;
                }
                if(startedContentCells && cell.type != CellType.CM_Content && cell.type != CellType.CM_Blank) {
                    breakIteration = true;
                    break;
                }
                if(cell.type == CellType.CM_Content && isNumericColumnVector[j] && isNaN(Number(cell.string))) {
                    if(!startedContentCells) startedContentCells = true;
                    if(cell.string.trim().length == 0) continue;
                    isNumericColumnVector[j] = false;
                    if(isNumericColumnVector.every(function (entry) { return entry == false; })) return;
                }
            }
        }

        //apply right align to all numeric columns
        for (var i = 0, len = grid.length; i < len; i++) {
            var line = grid[i];
            for(var j = 0, rowLen = line.length; j < rowLen; j++) {
                var cell = line[j];
                if(isNumericColumnVector[j] == true) { cell.setAlign(CellAlign.Right); }
            }
        }
    }
    // フォーマット済み範囲を走査しフォーマット対象の範囲を決める
    public getTargetRange(line: number, checkedIndex: number, ignoreRangeLines: Array<number>, maxLineCount: number): { min: number, count: number, checkedIndex: number } {
        // 判定に引っかからなかった場合のために初期値として最終区画の範囲を設定しておく
        var min = (ignoreRangeLines.length > 0) ? ignoreRangeLines[ignoreRangeLines.length - 1] + 1 : 0
        var cnt = maxLineCount - min;

        for (var j = checkedIndex; j < ignoreRangeLines.length; j++) {
            // 行が通り越したら
            if (line < ignoreRangeLines[j]) {
                // 偶数行（start）
                if (j % 2 == 0) {
                    // フォーマット済み範囲間なので範囲を設定
                    min = (j == 0) ? 0 : ignoreRangeLines[j - 1] + 1;
                    cnt = ignoreRangeLines[j] - min;
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

        return { min: min, count: cnt, checkedIndex: checkedIndex };
    }
}
