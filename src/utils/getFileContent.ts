import * as vscode from "vscode";
const { window } = vscode

export async function getFileContent(): Promise<string> {
    const currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName;
    console.log(currentlyOpenTabfilePath, "currentlyOpen")

    const documentObj = await vscode.workspace.openTextDocument(currentlyOpenTabfilePath)
    const content = documentObj.getText();
    return content
}