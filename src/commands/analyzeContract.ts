import * as vscode from 'vscode';
import { AuthService, AnalysesService } from '../../node_modules/mythxjs/dist/index.node'

import { syntaxHighlight } from '../utils/syntaxHighlight'

const { window } = vscode

async function start() {
    window.showInformationMessage(`Start analysing smart contract ${window.activeTextEditor.document.fileName} `)
    window.createOutputChannel('output')

    const APISERVICE = new AuthService('0x0000000000000000000000000000000000000000', 'trial');
    const tokens = await APISERVICE.login()

    const { access } = tokens

    const ANALYSESSERVICE = new AnalysesService()
    const contractData: any = await ANALYSESSERVICE.submitContract(access)
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
            title: "Analysing smart contract"
        },
        (_) => new Promise(
            (resolve) => {
                // Handle infinite queue
                let timer = setInterval(async () => {
                    const analysis = await ANALYSESSERVICE.getAnalysisStatus(uuid, access)
                    console.log(analysis.status)
                    if (analysis.status === "Finished") {
                        clearInterval(timer)
                        resolve('done')
                    }
                }, 2000);
            }))


    const detectedIssue = await ANALYSESSERVICE.getDetectedIssues(uuid, access)

    // Set HTML content
    panel.webview.html = getWebviewContent(detectedIssue);

}

export async function analyzeContract(): Promise<void> {
    start()
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
.string { color: green; }
.number { color: darkorange; }
.boolean { color: blue; }
.null { color: magenta; }
.key { color: red; }
</style>
  <body>
        <h2>Result of analysed smart contract</h2>
        <h3>This could take up to a couple of minutes..</h3>
        <pre id="json">${syntaxHighlight(JSON.stringify(data, undefined, 2))}</pre>
  </body>
  </html>`;
}