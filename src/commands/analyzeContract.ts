import * as vscode from 'vscode';
import { AuthService, AnalysesService } from '../../node_modules/mythxjs/dist/index.node'
import { ext } from '../extensionVariables'

import { MOCK_ISSUE } from '../mocks/issues'

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
    console.log(detectedIssue, 'detected')
    window.showInformationMessage(detectedIssue);


    ext.outputChannel.append(MOCK_ISSUE)
    ext.outputChannel.show()

}

export async function analyzeContract(): Promise<void> {
    start()
}

