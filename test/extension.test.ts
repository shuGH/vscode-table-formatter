import * as assert from 'assert';

import * as vscode from 'vscode';
import * as path from 'path';
import * as Extension from '../src/extension';

import { TableInfo } from '../src/table';
import { TableHelper } from '../src/helper';
import { TableFormatter } from '../src/formatter';
import { TableEditor } from '../src/editor';

class TestSetting {
    testName: string;
    inputFile: string;
    correctFile: string;
    positionList: Array<vscode.Position>;
    constructor(name: string, input: string, correct: string, list: Array<vscode.Position>)
    {
        this.testName = name;
        this.inputFile = input;
        this.correctFile = correct;
        this.positionList = list;
    }
}

suite("Extension Tests", () => {
    var tableHelper = new TableHelper();
    var tableFormatter = new TableFormatter();
    var tableEditor = new TableEditor();
    var testSettings = [
        new TestSetting("Plain Formatting", "input.txt", "correct.txt", [
            new vscode.Position(3, 0),
            new vscode.Position(4, 10),
            new vscode.Position(5, 40)
        ]),
        new TestSetting("Markdown Formatting", "input.txt", "correct.txt", [
            new vscode.Position(10, 8),
            new vscode.Position(11, 8),
            new vscode.Position(12, 8),
            new vscode.Position(13, 8)
        ]),
        new TestSetting("Textile Formatting", "input.txt", "correct.txt", [
            new vscode.Position(17, 6),
            new vscode.Position(18, 3),
            new vscode.Position(19, 9),
            new vscode.Position(20, 0)
        ]),
        new TestSetting("Grid Formatting", "input.txt", "correct.txt", [
            new vscode.Position(24, 0),
            new vscode.Position(25, 0),
            new vscode.Position(26, 0),
            new vscode.Position(27, 0),
            new vscode.Position(28, 1),
            new vscode.Position(29, 1),
            new vscode.Position(30, 1)
        ]),
        // new TestSetting("Simple Formatting", "input.txt", "correct.txt", [
        //     new vscode.Position(36, 12)
        // ]),
        new TestSetting("Complex Formatting", "input.txt", "correct.txt", [
            new vscode.Position(44, 10),
            new vscode.Position(45, 1),
            new vscode.Position(46, 10),
            new vscode.Position(47, 1),
            new vscode.Position(48, 20)
        ])
    ];
    var rootPath = path.join(__dirname, "../../test/res");
    let editor = vscode.window.activeTextEditor;

    function formatTest(setting: TestSetting): Thenable<any> {
        var inputUri = vscode.Uri.file(path.join(rootPath, setting.inputFile));
        var correctUri = vscode.Uri.file(path.join(rootPath, setting.correctFile));
        return vscode.workspace.openTextDocument(inputUri).then((inputDoc) => {
            return vscode.workspace.openTextDocument(correctUri).then((correctDoc) => {
                setting.positionList.forEach(elem => {
                    var info = tableHelper.getTableInfo(inputDoc, elem.line);
                    console.log("================")
                    console.log(inputDoc.getText(info.range));
                    console.log("================")
                    console.log(JSON.stringify(info.range));
                    info.cellGrid.forEach((elem, i) => {
                        console.log(String(i) + ": " + JSON.stringify(elem));
                    });
                    console.log(JSON.stringify(info.size));
                    var formatted = tableFormatter.getFormatTableText(inputDoc, info);
                    var endPos = new vscode.Position(info.range.end.line, correctDoc.lineAt(info.range.end.line).range.end.character);
                    console.log("================")
                    console.log(formatted);
                    console.log("================")
                    console.log(correctDoc.getText(new vscode.Range(info.range.start, endPos)));
                    var lines = formatted.split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        assert.equal(
                            lines[i],
                            correctDoc.lineAt(info.range.start.line + i).text
                        );
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
