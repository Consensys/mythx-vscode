import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { analyzeContract } from "./commands/analyzeContract";
import { runFullMode } from "./commands/runFullMode";
import { runStandardMode } from './commands/runStandardMode';


let diagnosticsCollection: vscode.DiagnosticCollection

export async function activate(context: vscode.ExtensionContext) {
    ext.context = context;
    ext.outputChannel = vscode.window.createOutputChannel("MythX");

    diagnosticsCollection = vscode.languages.createDiagnosticCollection('mythx');

    vscode.commands.registerCommand("mythx.analyzeContract", async (fileUri: vscode.Uri) => {
        analyzeContract(diagnosticsCollection, fileUri)
    });

    vscode.commands.registerCommand("mythx.runFullMode", async () => {
        runFullMode(vscode.window.activeTextEditor.document.uri.fsPath)
    });

    vscode.commands.registerCommand("mythx.runStandardMode", async () => {
        runStandardMode(vscode.window.activeTextEditor.document.uri.fsPath)
    });
}