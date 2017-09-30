import * as assert from 'assert';

import * as vscode from 'vscode';
import * as path from 'path';
import * as Extension from '../src/extension';

import { TableInfo, TableEdgesType } from '../src/table';
import { Setting, TableHelper, TableFormatType, TableLineFlag } from '../src/helper';
import { TableFormatter } from '../src/formatter';
import { TableEditor } from '../src/editor';

class TestSetting {
    testName: string;
    inputFile: string;
    correctFile: string;
    positionList: Array<vscode.Position>;
    correctRange: { start: number, size: number };
    constructor(name: string, input: string, correct: string, range: { start: number, size: number }, list: Array<vscode.Position>)
    {
        this.testName = name;
        this.inputFile = input;
        this.correctFile = correct;
        this.correctRange = range;
        this.positionList = list;
    }
}

suite("Extension Tests", () => {
    let settings: Setting = {
        markdown: {
            oneSpacePadding: true,
            tableEdgesType: TableEdgesType.Auto
        },
        common: {
            explicitFullwidthChars: [],
            trimTrailingWhitespace: true,
            centerAlignedHeader: true,
            rightAlignNumericColumns: true,
            rightAlignedNumeric: true
        }
    }

    var tableHelper = new TableHelper(settings);
    var tableFormatter = new TableFormatter(settings, tableHelper);
    var tableEditor = new TableEditor();
    var testSettings = [
        new TestSetting("Plain Formatting", "input.txt", "correct.txt",
            { start: 3, size : 3 }, [
            new vscode.Position(3, 0),
            new vscode.Position(4, 10),
            new vscode.Position(5, 40)
        ]),
        new TestSetting("Markdown Formatting", "input.txt", "correct.txt",
            { start: 10, size : 4 }, [
            new vscode.Position(10, 8),
            new vscode.Position(11, 8),
            new vscode.Position(12, 8),
            new vscode.Position(13, 8)
        ]),
        new TestSetting("Textile Formatting", "input.txt", "correct.txt",
            { start: 17, size : 4 }, [
            new vscode.Position(17, 6),
            new vscode.Position(18, 3),
            new vscode.Position(19, 9),
            new vscode.Position(20, 0)
        ]),
        new TestSetting("Grid Formatting", "input.txt", "correct.txt",
            { start: 24, size : 7 }, [
            new vscode.Position(24, 0),
            new vscode.Position(25, 0),
            new vscode.Position(26, 0),
            new vscode.Position(27, 0),
            new vscode.Position(28, 1),
            new vscode.Position(29, 1),
            new vscode.Position(30, 1)
        ]),
        new TestSetting("Simple Formatting", "input.txt", "correct.txt",
            { start: 34, size : 8 }, [
            new vscode.Position(34, 0),
            new vscode.Position(35, 12),
            new vscode.Position(36, 1),
            new vscode.Position(37, 4),
            new vscode.Position(38, 6),
            new vscode.Position(39, 12),
            new vscode.Position(40, 22),
            new vscode.Position(41, 1)
        ]),
        new TestSetting("Complex Formatting", "input.txt", "correct.txt",
            { start: 45, size : 5 }, [
            new vscode.Position(45, 10),
            new vscode.Position(46, 1),
            new vscode.Position(47, 10),
            new vscode.Position(48, 1),
            new vscode.Position(49, 20)
        ])
    ];
    var rootPath = path.join(__dirname, "../../test/res");
    let editor = vscode.window.activeTextEditor;

    function testFormatting(type: TableFormatType, setting: TestSetting, pos: vscode.Position, inputDoc: vscode.TextDocument, correctDoc: vscode.TextDocument, ): boolean {
        var range = tableHelper.getTableRange(inputDoc, pos.line, type);
        if (!range.isEmpty) {
            var info = tableHelper.getTableInfo(inputDoc, range, type);
            console.log("= Text ===============")
            let text = inputDoc.getText(info.range)
            let textArray = text.split(/\r\n|\r|\n/);
            console.log(text);
            console.log("= Range ===============")
            console.log(JSON.stringify(info.range));
            console.log("= CellInfo ===============")
            info.cellGrid.forEach((line, i) => {
                console.log("- " + String(i) + " ---------------")
                console.log(textArray[i])
                line.forEach((cell, j) => {
                    console.log(String(j) + ": " + JSON.stringify(cell, ["_string", "_size", "_length", "_delimiter", "_type", "_align", "_padding"]));
                });
            });
            console.log("= Size ===============")
            console.log(JSON.stringify(info.size));
            console.log(JSON.stringify(info.getMaxCellSizeList()));
            console.log("= Range Check ===============")
            console.log("start: " + info.range.start.line + " == " + setting.correctRange.start + ", end: " + info.range.end.line + " == " + (setting.correctRange.start + setting.correctRange.size - 1));
            assert.equal(info.range.start.line, setting.correctRange.start);
            assert.equal(info.range.end.line, setting.correctRange.start + setting.correctRange.size - 1);

            var formatted = tableFormatter.getFormattedTableText(inputDoc, info, type, tableHelper);
            var endPos = new vscode.Position(info.range.end.line, correctDoc.lineAt(info.range.end.line).range.end.character);
            console.log("= Formatted ===============")
            console.log(formatted);
            console.log("= Correct ===============")
            console.log(correctDoc.getText(new vscode.Range(info.range.start, endPos)));
            var lines = formatted.split('\n');
            for (var i = 0; i < lines.length; i++) {
                assert.equal(
                    lines[i],
                    correctDoc.lineAt(info.range.start.line + i).text
                );
            }
            return true;
        }
        return false;
    }

    function formatTest(setting: TestSetting): Thenable<any> {
        var inputUri = vscode.Uri.file(path.join(rootPath, setting.inputFile));
        var correctUri = vscode.Uri.file(path.join(rootPath, setting.correctFile));
        return vscode.workspace.openTextDocument(inputUri).then((inputDoc) => {
            return vscode.workspace.openTextDocument(correctUri).then((correctDoc) => {
                setting.positionList.forEach(elem => {
                    if (!testFormatting(TableFormatType.Normal, setting, elem, inputDoc, correctDoc)) {
                        testFormatting(TableFormatType.Simple, setting, elem, inputDoc, correctDoc);
                    }
                });
                return Promise.resolve();
            }, (err) => {
                assert.ok(false, `error: ${err}`);
                return Promise.reject(err);
            });
        }, (err) => {
            assert.ok(false, `error: ${err}`);
            return Promise.reject(err);
        });
    }

    testSettings.forEach(elem => {
        test(elem.testName, (done) => {
            formatTest(elem).then(() => done(), done);
        });
    });
});
