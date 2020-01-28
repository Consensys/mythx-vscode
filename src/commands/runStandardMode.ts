import * as vscode from 'vscode'
import { Client } from 'mythxjs'

import { getCredentials } from '../login/getCredentials'

import { Credentials, Bytecode } from '../utils/types'
import { getFileContent } from '../utils/getFileContent'
import { getContractName } from '../utils/getContractName'
import { getCompiledData } from '../utils/getCompiledData'
import { createAnalyzeRequest } from '../utils/createAnalyzeRequest'
const os = require('os')

let mythx: Client

export async function runStandardMode(fileUri: vscode.Uri): Promise<void> {
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

                                const contract = compiled.contracts[FILEPATH]

                                const sources = compiled.sources

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
                                    'standard',
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
                                        `Your analysis has been submitted! 
                                        Your detailed scan results will be ready in approximately 30 mins at the following link:
								${dashboardLink}/${uuid}`,
                                        'Dismiss',
                                    )
                                    .then((x) => {
                                        return
                                    })

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
                                        `MythXvsc: No security issues found in your contract.`,
                                    )
                                } else {
                                    vscode.window.showWarningMessage(
                                        `MythXvsc: found ${filtered.length} security issues with contract.`,
                                    )
                                }
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
