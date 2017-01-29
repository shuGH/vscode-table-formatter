'use strict';

import * as vscode from 'vscode';

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
    Space
};

// Cell info
export class CellInfo {
    private _size: number;
    private _delimiter: DelimiterType;
    private _type: CellType;
    private _align: CellAlign;
    private _padding: number;

    constructor(size: number, delimiter: DelimiterType = DelimiterType.Pipe, type: CellType = CellType.CM_Blank, align: CellAlign = CellAlign.Left, padding: number = 0) {
        this._size = size;
        this._delimiter = delimiter;
        this._type = type;
        this._align = align;
        this._padding = padding;
    }

    get size(): number {
        return this._size;
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

    setSize(size: number) {
        this._size = size;
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
}

export class TableInfo {
    // TextDocument上の範囲
    private _range: vscode.Range;
    // セルデータの２次元配列（左端の表が始まるまでの空白も列として含む）
    private _cellGrid: Array<Array<CellInfo>>;
    // 表のサイズ（空白列も含む）
    private _size: { row: number, col: number };

    constructor(range: vscode.Range, cells: Array<Array<CellInfo>>) {
        this._range = range;
        this._cellGrid = cells;
        this._size = this.getSize();
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

    private getSize(): { row: number, col: number } {
        if (!this.isValid()) return { row: 0, col: 0 };

        // 正規化済みなのでどの行も同じサイズ
        return {
            row: this._cellGrid.length,
            col: this._cellGrid[0].length
        };
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
