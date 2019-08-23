import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { analyzeContract } from "./commands/analyzeContract";


let diagnosticsCollection: vscode.DiagnosticCollection

export async function activate(context: vscode.ExtensionContext) {
    const {window} = vscode
    ext.context = context;
    ext.outputChannel = vscode.window.createOutputChannel("MythX");

    const foo = vscode.workspace.getConfiguration('solidity');
    console.log(foo)

    diagnosticsCollection = vscode.languages.createDiagnosticCollection('mythx');

    vscode.commands.registerCommand("mythx.analyzeContract", () => {
        analyzeContract(diagnosticsCollection)
    });
}