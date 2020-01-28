import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { analyzeContract } from "./commands/analyzeContract";
import { runDeepMode } from "./commands/runDeepMode";
import { runStandardMode } from './commands/runStandardMode';


let diagnosticsCollection: vscode.DiagnosticCollection

export async function activate(context: vscode.ExtensionContext) {
    ext.context = context;
    ext.outputChannel = vscode.window.createOutputChannel("MythX");

    diagnosticsCollection = vscode.languages.createDiagnosticCollection('mythx');

    vscode.commands.registerCommand("mythx.analyzeContract", async () => {
        analyzeContract(diagnosticsCollection, vscode.window.activeTextEditor.document.uri)
    });

    vscode.commands.registerCommand("mythx.runDeepMode", async () => {
        runDeepMode(vscode.window.activeTextEditor.document.uri)
    });

    vscode.commands.registerCommand("mythx.runStandardMode", async () => {
        runStandardMode(vscode.window.activeTextEditor.document.uri)
    });
}