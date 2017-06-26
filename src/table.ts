'use strict';

import * as vscode from 'vscode';
import { Setting } from './helper';

var strWidth = require('string-width')
var trim = require('trim')

// Cell type
export enum CellType {
    CM_Blank,               // 空白
    CM_Content,             // 文字列
    CM_MinusSeparator,
    CM_EquallSeparator,
    MD_LeftSeparator,
    MD_RightSeparator,
    MD_CenterSeparator,
    TT_HeaderPrefix,
    TT_LeftPrefix,
    TT_RightPrefix,
    TT_CenterPrefix
};

// Cell align
export enum CellAlign {
    Left,
    Center,
    Right
};

// Delimiter type
export enum DelimiterType {
    Pipe,
    Plus,
    Space,
    // Comma
};

// Separator type
enum SeparatorType {
    None,
    Minus,
    Equall
};

// Table property
export interface TableProperty {
    // マークダウンか（セパレーター行の前に１行しかないとき）
    isMarkdown: false,
};

// Cell info
export class CellInfo {
    private _settings: Setting;

    // 内容（文字列を丸ごと保持するのはいかがなものか、メモリ的に）
    private _string: string;
    // サイズ（最終的に書き出す長さ）
    private _size: number;
    // サイズと文字数の差（半角を１、全角文字を２とした長さとString.lengthの差）
    private _diff: number;

    private _delimiter: DelimiterType;
    private _type: CellType;
    private _align: CellAlign;
    // 左パディング（Textile用）
    private _padding: number;

    constructor(settings: Setting, trimmed: string, delimiter: DelimiterType = DelimiterType.Pipe, type: CellType = CellType.CM_Blank, align: CellAlign = CellAlign.Left, padding: number = 0) {
        this._settings = settings;

        this._string = trimmed;
        this._size = this.getStringLength(this._string);
        this._diff = this._size - trimmed.length;
        
        this._delimiter = delimiter;
        this._type = type;
        this._align = align;
        this._padding = padding;
    }

    get string(): string {
        return this._string;
    }

    get size(): number {
        return this._size;
    }

    get diff(): number {
        return this._diff;
    }

    get delimiter(): DelimiterType {
        return this._delimiter;
    }

    get type(): CellType {
        return this._type;
    }

    get align(): CellAlign {
        return this._align;
    }

    get padding(): number {
        return this._padding;
    }

    isValid(): boolean {
        if (this._size < 0) return false;
        return true;
    }

    setString(trimmed: string) {
        this._string = trimmed;
    }
    
    setSize(size: number) {
        this._size = size;
    }

    setDiff(length: number) {
        this._diff = length;
    }

    setDelimiter(delimiter: DelimiterType) {
        this._delimiter = delimiter;
    }

    setType(type: CellType) {
        this._type = type;
    }

    setAlign(align: CellAlign) {
        this._align = align;
    }

    setPadding(padding: number) {
        this._padding = padding;
    }

    // 文字数の取得
    private getStringLength(str: string): number {
        if (this._settings.common.explicitFullwidthChars.length == 0) {
            return strWidth(str);
        }

        // 強制的に全角判定の文字が含まれていたら個数分加算する
        let cnt = strWidth(str);
        this._settings.common.explicitFullwidthChars.forEach((reg, i) => {
            cnt += (str.match(reg) || []).length;
        });

        return cnt;
    }
}

export class TableInfo {
    private _settings: Setting;
    private _property: TableProperty;

    // TextDocument上の範囲
    private _range: vscode.Range;
    // セルデータの２次元配列（左端の表が始まるまでの空白も列として含む）
    private _cellGrid: Array<Array<CellInfo>>;
    // 表のサイズ（空白列も含む）
    private _size: { row: number, col: number };

    constructor(settings: Setting, range: vscode.Range, grid: Array<Array<CellInfo>>) {
        this._settings = settings;
        this._property = {
            isMarkdown: false
        }

        this._range = range;
        this._cellGrid = [];
        this._size = { row: 0, col: 0 };

        this.setupCellGrid(grid);
        this.setupSize();
    }

    get property(): TableProperty {
        return this._property;
    }
    
    get range(): vscode.Range {
        return this._range;
    }

    get cellGrid(): Array<Array<CellInfo>> {
        return this._cellGrid;
    }

    get size(): { row: number, col: number } {
        return this._size;
    }

    // サイズの設定
    private setupSize() {
        if (!this.isValid()) return;
        // 正規化済みなのでどの行も同じサイズ
        this._size.row = this._cellGrid.length;
        this._size.col = this._cellGrid[0].length;
    };

    // 全行のサイズを最大のものに揃える
    private setupRowSize() {
        var max = 0;
        this._cellGrid.forEach(row => {
            max = Math.max(max, row.length);
        });
        this._cellGrid.forEach(row => {
            // デリミタも揃える
            var delimiter = (row.length > 0) ? row[0].delimiter : DelimiterType.Pipe;
            for (var c = row.length; c < max; c++) {
                row.push(new CellInfo(this._settings, "", delimiter));
            }
        });
    }

    // セパレータタイプの確定
    private setupSeparatorType() {
        this._cellGrid.forEach(row => {
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
    }

    // 全セルのサイズを確定
    private setupCellSize() {
        // Markdownのセパレータのサイズを設定
        // 左右のスペーサー分がフォーマット時に加算されるため-2する
        let offset = (this._settings.markdown.oneSpacePadding) ? 0 : -2;
        this._cellGrid.forEach(row => {
            row.forEach(cell => {
                if (cell.type == CellType.CM_MinusSeparator || cell.type == CellType.CM_EquallSeparator) {
                    // 最小である3文字にする（---）
                    cell.setSize(3 + offset);
                }
                else if (cell.type == CellType.MD_LeftSeparator || cell.type == CellType.MD_RightSeparator) {
                    // 最小である4文字にする（:---, ---:）
                    cell.setSize(4 + offset);
                }
                else if (cell.type == CellType.MD_CenterSeparator) {
                    // 最小である5文字にする（:---:）
                    cell.setSize(5 + offset);
                }
            });
        });

        // Textileのサイズを設定
        this._cellGrid.forEach(row => {
            // プレフィックス分のパディングを他の行の同列に設定する
            row.forEach((cell, i) => {
                if (cell.type == CellType.TT_HeaderPrefix || cell.type == CellType.TT_LeftPrefix || cell.type == CellType.TT_RightPrefix || cell.type == CellType.TT_CenterPrefix) {
                    this._cellGrid.forEach(elem => {
                        if (i < elem.length) {
                            elem[i].setPadding(2);
                        }
                    });
                }
            });
        });
    }

    // 全セルの位置揃えを確定
    private setupCellAlign() {
        // Markdownの位置揃え
        for (var r = this._cellGrid.length - 1; r >= 0; r--) {
            var row = this._cellGrid[r];
            // 各列の位置揃えを変更する
            row.forEach((cell, c) => {
                switch (cell.type) {
                    case CellType.MD_LeftSeparator:
                        this._cellGrid.forEach(elem => {
                            if (c < elem.length) {
                                elem[c].setAlign(CellAlign.Left);
                            }
                        });
                        break;
                    case CellType.MD_RightSeparator:
                        this._cellGrid.forEach(elem => {
                            if (c < elem.length) {
                                elem[c].setAlign(CellAlign.Right);
                            }
                        });
                        break;
                    case CellType.MD_CenterSeparator:
                        this._cellGrid.forEach(elem => {
                            if (c < elem.length) {
                                elem[c].setAlign(CellAlign.Center);
                            }
                        });
                        break;
                }
            });
        }

        // Textileの位置揃え
        this._cellGrid.forEach(row => {
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
    }

    // 表データを正規化して設定
    private setupCellGrid(grid: Array<Array<CellInfo>>) {
        this._cellGrid = grid;

        this.setupRowSize();
        this.setupSeparatorType();
        this.setupCellSize();
        this.setupCellAlign();
    };

    isValid(): boolean {
        if (!this._range || this._range.isEmpty) return false;
        if (!this._cellGrid || this._cellGrid.length == 0) return false;
        var size = this._cellGrid[0].length;
        this._cellGrid.forEach(row => {
            if (!row || row.length == 0 || row.length != size) return false;
            row.forEach(cell => {
                if (!cell.isValid()) return false;
            });
        });
        return true;
    };

    getMaxCellSizeList(): Array<number> {
        if (!this.isValid()) return [];

        var list = [];
        for (var c = 0; c < this._size.col; c++) {
            var max = 0;
            this._cellGrid.forEach((row, r) => {
                if (r == 0) max = row[c].size;
                // １列目は空白列なので小さい方を取る（最も空白が少ない位置に合わせる）
                if (c == 0) {
                    max = Math.min(max, row[c].size);
                }
                else {
                    max = Math.max(max, row[c].size);
                }
            })
            list.push(max);
        }
        return list;
    };
}
