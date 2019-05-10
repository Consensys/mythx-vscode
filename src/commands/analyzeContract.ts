import * as vscode from 'vscode';
import { AnalysesService, AuthService } from 'mythxjs'

import { syntaxHighlight } from '../utils/syntaxHighlight'

const { window } = vscode

async function start() {
    window.showInformationMessage(`Start analysing smart contract ${window.activeTextEditor.document.fileName} `)

    const APISERVICE = new AuthService('0x79b483371e87d664cd39491b5f06250165e4b184', 'Abcdefg1!');
    const tokens = await APISERVICE.login()

    const { access } = tokens

    const ANALYSESSERVICE = new AnalysesService()
    const contractData: any = await ANALYSESSERVICE.submitContract('__contracts/vulnerable.sol')
    const { uuid } = contractData

    // Create and show panel
    const panel = vscode.window.createWebviewPanel(
        'analysisResult',
        'Analysis Result',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // Get in progress bar
    await window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Analysing smart contract",
            cancellable: true
        },
        (_) => new Promise(
            (resolve) => {
                // Handle infinite queue
                const timer = setInterval(async () => {
                    const analysis = await ANALYSESSERVICE.getAnalysisStatus(uuid, access)
                    console.log(analysis.status)
                    if (analysis.status === "Finished") {
                        clearInterval(timer)
                        resolve('done')
                    }
                }, 10000);
            }))


    const detectedIssue = await ANALYSESSERVICE.getDetectedIssues(uuid, access)

    vscode.window.showWarningMessage(`Mythx found 2 errors and 1 security warning with token.sol contract.`);

    // Set HTML content
    panel.webview.html = getWebviewContent(detectedIssue);
}

export async function analyzeContract(): Promise<void> {

    window.showInformationMessage(`Start analysing smart contract ${window.activeTextEditor.document.fileName} `)
    await start()
    const diagnosticsCollection = vscode.languages.createDiagnosticCollection('test');
    vscode.window.onDidChangeActiveTextEditor(e => {
        if (e && e.document) {
            const diagnostics: vscode.Diagnostic[] = [];

            const { Diagnostic, Range, Position, DiagnosticSeverity } = vscode

            let message = "this is a message with multiple lines. \nLine 1\nLine2\nLine3";
            const diagnostic = new vscode.Diagnostic(new vscode.Range(new vscode.Position(10, 1), new vscode.Position(10, 10)), message, vscode.DiagnosticSeverity.Error);
            diagnostic.source = 'test';
            diagnostic.code = '1234';
            diagnostic.relatedInformation = [];


            let diag = new Diagnostic(new Range(new Position(12, 0), new Position(12, 22)), `The binary subtraction can underflow.`, DiagnosticSeverity.Error);
            let firstWarn = new Diagnostic(new Range(new Position(13, 0), new Position(13, 10)), `The binary addition can overflow`, DiagnosticSeverity.Error);
            let secondWarn = new Diagnostic(new Range(new Position(0, 0), new Position(0, 30)), `MythX API Trial Mode`, DiagnosticSeverity.Warning);

            diagnostics.push(diag, firstWarn, secondWarn);
            diagnosticsCollection.set(e.document.uri, diagnostics);
        }
    });
}



function getWebviewContent(data) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Analysis result</title>
  </head>
  <style>
  h1 {color: red;}
  pre { padding: 5px; margin: 5px; }
.string { color: #00C000; }
.number { color: darkorange; }
.boolean { color: blue; }
.null { color: magenta; }
.key { color: #F92572; }
</style>
  <body>
        <h2>Detailed analysis of smart contract:</h2>
        <pre id="json">${syntaxHighlight(JSON.stringify(data, undefined, 2))}</pre>
  </body>
  </html>`;
}