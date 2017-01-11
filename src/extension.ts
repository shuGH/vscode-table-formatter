'use strict';

import * as vscode from 'vscode';

var strWidth = require('string-width')
var utilPad = require('utils-pad-string')

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscodetableformatter" is now active!');

    let cmd1 = vscode.commands.registerCommand('extension.format', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    let cmd2 = vscode.commands.registerCommand('extension.unformat', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    let cmd3 = vscode.commands.registerCommand('extension.insertBreak', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(cmd1);
    context.subscriptions.push(cmd2);
    context.subscriptions.push(cmd3);
}

export function deactivate() {
}
