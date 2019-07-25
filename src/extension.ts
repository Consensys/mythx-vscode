import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { AzureUserInput } from "vscode-azureextensionui";
import { analyzeContract } from "./commands/analyzeContract";


let diagnosticsCollection: vscode.DiagnosticCollection

export async function activate(context: vscode.ExtensionContext) {
    const {window} = vscode
    ext.context = context;
    ext.outputChannel = vscode.window.createOutputChannel("MythX");
    ext.ui = new AzureUserInput(context.globalState);

    diagnosticsCollection = vscode.languages.createDiagnosticCollection('mythx');

    vscode.commands.registerCommand("mythx.analyzeContract", () => {
        analyzeContract(diagnosticsCollection)
    });
}