import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { AzureUserInput } from "vscode-azureextensionui";
import { analyzeContract } from "./commands/analyzeContract";

export async function activate(context: vscode.ExtensionContext) {
    ext.context = context;
    ext.outputChannel = vscode.window.createOutputChannel("MythX");
    ext.ui = new AzureUserInput(context.globalState);
    
    vscode.commands.registerCommand("mythx.analyzeContract", analyzeContract);
}