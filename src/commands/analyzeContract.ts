import * as vscode from 'vscode'
import { Client } from 'mythxjs'

import { getCredentials } from '../login/getCredentials'

import { errorCodeDiagnostic } from '../errorCodeDiagnostic'

import { Bytecode, Credentials } from '../utils/types'
import { getFileContent } from '../utils/getFileContent'
import { getCompiledData } from '../utils/getCompiledData'
import { getContractName } from '../utils/getContractName'
import { createAnalyzeRequest } from '../utils/createAnalyzeRequest'
const os = require('os')
const { window } = vscode
let mythx: Client

export async function analyzeContract(
    diagnosticCollection: vscode.DiagnosticCollection,
    fileUri: vscode.Uri,
): Promise<void> {
    await vscode.extensions
        .getExtension('JuanBlanco.solidity')
        .activate()
        .then(
            async () => {
                vscode.commands
                    .executeCommand('solidity.compile.active')
                    .then(async (done) => {
                        try {
                            if (!done) {
                                throw new Error(
                                    `MythX: Error with solc compilation.`,
                                )
                            } else {
                                const credentials: Credentials = await getCredentials()
                                const projectConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(
                                    'mythxvsc',
                                )
                                let environment: string =
                                    'https://api.mythx.io/v1/"'
                                if (projectConfiguration.environment) {
                                    environment =
                                        projectConfiguration.environment
                                }

                                mythx = new Client(
                                    credentials.ethAddress,
                                    credentials.password,
                                    'mythXvsc',
                                    environment,
                                )

                                await mythx.login()

                                const fileContent = await getFileContent(
                                    fileUri,
                                )

                                const contractName = await getContractName(
                                    fileUri,
                                )

                                const compiled: any = await getCompiledData(
                                    fileUri,
                                )

                                /*
								CREATE REQUEST OBJECT
							    */

                               let FILEPATH = fileUri.fsPath

                               // Windows OS hack
                               if (os.platform() === 'win32') {
                                   FILEPATH = FILEPATH.replace(/\\/g, '/')
                                   if (FILEPATH.charAt(0) === '/') {
                                       FILEPATH = FILEPATH.substr(1)
                                   }
                               }

                                const contract =
                                    compiled.contracts[FILEPATH]
                                console.log(contract);

                                const sources = compiled.sources
                                console.log(sources);
                                // source is required by our API but does not exist in solc output
                                sources[FILEPATH].source = fileContent

                                // Bytecode
                                const bytecode: Bytecode =
                                    contract[contractName].evm.bytecode
                                const deployedBytecode: Bytecode =
                                    contract[contractName].evm.deployedBytecode

                                // Metadata
                                const metadata = JSON.parse(
                                    contract[contractName].metadata,
                                )
                                const solcVersion = metadata.compiler.version

                                const requestMythx = createAnalyzeRequest(
                                    contractName,
                                    bytecode,
                                    deployedBytecode,
                                    FILEPATH,
                                    sources,
                                    compiled,
                                    solcVersion,
                                    'quick',
                                )

                                const analyzeRes = await mythx.analyze(
                                    requestMythx,
                                )

                                // TODO: MOVE THIS TO OWN FILE AND MAKE IT AVAILABLE TO ALL COMMANDS
                                let dashboardLink: string =
                                    'https://dashboard.mythx.io/#/console/analyses'

                                if (
                                    environment ===
                                    'https://api.staging.mythx.io/v1/'
                                ) {
                                    dashboardLink =
                                        'https://dashboard.staging.mythx.io/#/console/analyses'
                                }

                                const { uuid } = analyzeRes

                                vscode.window
                                    .showInformationMessage(
                                        `Your analysis has been submitted! Wait for vscode linting or see your detailed scan results at
								${dashboardLink}/${uuid}`,
                                        'Dismiss',
                                    )
                                    .then((x) => {
                                        return
                                    })

                                // Get in progress bar
                                await window.withProgress(
                                    {
                                        cancellable: true,
                                        location:
                                            vscode.ProgressLocation
                                                .Notification,
                                        title: `Analysing smart contract ${contractName}`,
                                    },
                                    (_) =>
                                        new Promise((resolve) => {
                                            // Handle infinite queue
                                            const timer = setInterval(
                                                async () => {
                                                    const analysis = await mythx.getAnalysisStatus(
                                                        uuid,
                                                    )
                                                    if (
                                                        analysis.status ===
                                                        'Finished'
                                                    ) {
                                                        clearInterval(timer)
                                                        resolve('done')
                                                    }
                                                },
                                                10000,
                                            )
                                        }),
                                )

                                diagnosticCollection.clear()
                                const analysisResult = await mythx.getDetectedIssues(
                                    uuid,
                                )

                                const { issues } = analysisResult[0]

                                // Some warning have messages but no SWCID (like free trial user warn)
                                const filtered = issues.filter(
                                    (issue) => issue.swcID !== '',
                                )
                                if (!filtered) {
                                    vscode.window.showInformationMessage(
                                        `MythXvs: No security issues found in your contract.`,
                                    )
                                } else {
                                    vscode.window.showWarningMessage(
                                        `MythXvs: found ${filtered.length} security issues with contract.`,
                                    )
                                }

                                // Diagnostic
                                errorCodeDiagnostic(
                                    vscode.window.activeTextEditor.document,
                                    diagnosticCollection,
                                    analysisResult,
                                )
                            }
                        } catch (err) {
                            vscode.window.showErrorMessage(`MythXvsc: ${err}`)
                        }
                    })
            },
            (err) => {
                throw new Error(`MythX: Error with solc compilation. ${err}`)
            },
        )
}
