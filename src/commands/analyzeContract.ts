import * as vscode from 'vscode';

export async function analyzeContract(): Promise<void> {
    vscode.window.showInformationMessage('analyze contract called.');
}