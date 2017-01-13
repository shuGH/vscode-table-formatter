import * as assert from 'assert';

import * as vscode from 'vscode';
import * as path from 'path';
import * as Extension from '../src/extension';

import { TableInfo, TableHelper } from '../src/helper';
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
        new TestSetting("Simple Formatting", "input.txt", "correct.txt", [
            new vscode.Position(4, 2),
            new vscode.Position(8, 4)
        ]),
        new TestSetting("Markdown Formatting", "input.txt", "correct.txt", [
            new vscode.Position(16, 8)
        ]),
        new TestSetting("Textile Formatting", "input.txt", "correct.txt", [
            new vscode.Position(24, 9)
        ]),
        new TestSetting("Complex Formatting", "input.txt", "correct.txt", [
            new vscode.Position(30, 9),
            new vscode.Position(32, 0)
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
