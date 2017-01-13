'use strict';

import * as vscode from 'vscode';

var strWidth = require('string-width')
var trim = require('trim')

// Cell type
export enum CellType {
    None,
    MD_NormalSeparator,
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

// Cell info
export class CellInfo {
    private _size: number;
    private _type: CellType;
    private _align: CellAlign;
    private _padding: number;

    constructor(size: number, type: CellType = CellType.None, align: CellAlign = CellAlign.Left, padding: number = 0) {
        this._size = size;
        this._type = type;
        this._align = align;
        this._padding = padding;
    }

    get size(): number {
        return this._size;
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
    private _range: vscode.Range;
    private _cellGrid: Array<Array<CellInfo>>;
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
                // Use min in 1st col
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

export class TableHelper {

    constructor() {
    }

    dispose() {
    }

    public isTableLine(line: vscode.TextLine): boolean {
        if (line.isEmptyOrWhitespace) return false;
        var tableLineReg = /\|/;
        return tableLineReg.test(line.text);
    }

    public getCellInfoList(line: vscode.TextLine): Array<CellInfo> {
        if (line.isEmptyOrWhitespace) return [];

        var list: Array<CellInfo> = [];
        var cells = line.text.split("|", -1);

        // 1st element is white space. 
        list.push(new CellInfo(line.firstNonWhitespaceCharacterIndex));
        
        for (var i = 0; i < cells.length; i++) {
            var trimed = trim(cells[i]);
            // 1st white space
            if (i == 0 && trimed == "") continue;
            // last white space
            if (i == cells.length - 1 && trimed == "") continue;

            var size = strWidth(trimed);
            var type = CellType.None;
            var align = CellAlign.Left;

            // Markdown ----------------
            if (/^-+$/.test(trimed)) {
                type = CellType.MD_NormalSeparator;
                align = CellAlign.Left;
            }
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

            list.push(new CellInfo(size, type, align));
        }
        return list;
    }
    
    public getTableInfo(doc: vscode.TextDocument, line: number): TableInfo {
        // Scan back
        var startLine = line;
        for (var i = line; i >= 0; i--) {
            if (!this.isTableLine(doc.lineAt(i))) break;
            startLine = i;
        }

        // Scan forward
        var endLine = line;
        for (var i = line + 1; i < doc.lineCount; i++) {
            if (!this.isTableLine(doc.lineAt(i))) break;
            endLine = i;
        }

        // get cell info
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

    private getNormalizedCellGrid(grid: Array<Array<CellInfo>>): Array<Array<CellInfo>> {
        // Normalize grid size
        var max = 0;
        grid.forEach(row => {
            max = Math.max(max, row.length);
        });
        grid.forEach(row => {
            for (var c = row.length; c < max; c++) {
                row.push(new CellInfo(0));
            }
        });

        // Markdown separator
        grid.forEach(row => {
            var isSeparatorRow = false;
            row.forEach(cell => {
                if (cell.type == CellType.MD_NormalSeparator || cell.type == CellType.MD_LeftSeparator || cell.type == CellType.MD_RightSeparator || cell.type == CellType.MD_CenterSeparator) {
                    isSeparatorRow = true;
                }
            });
            // Set separator if text is white space
            if (isSeparatorRow) {
                row.forEach((cell, i) => {
                    if (i != 0 && cell.size == 0) {
                        cell.setType(CellType.MD_NormalSeparator);
                    }
                });
            }
        });

        // Markdown size
        grid.forEach(row => {
            row.forEach(cell => {
                // Minimum size is 3
                if (cell.type == CellType.MD_NormalSeparator || cell.type == CellType.MD_LeftSeparator || cell.type == CellType.MD_RightSeparator || cell.type == CellType.MD_CenterSeparator) {
                    cell.setSize(3);
                }
            });
        });

        // Textile size
        grid.forEach(row => {
            // Set padding for prefix
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

        // Markdown align
        for (var r = grid.length - 1; r >= 0; r--) {
            var row = grid[r];
            row.forEach((cell, c) => {
                // Set col align
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

        // Textile align
        grid.forEach(row => {
            row.forEach(cell => {
                // Set cell align
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
}
