import * as vscode from 'vscode'
import { Client } from 'mythxjs'

import { getCredentials } from '../login/getCredentials'

import { errorCodeDiagnostic } from '../errorCodeDiagnostic'

import { Bytecode, Credentials } from '../utils/types'
import { getFileContent } from '../utils/getFileContent'
import { getCompiledData } from '../utils/getCompiledData'
import { getContractName } from '../utils/getContractName'
import { createAnalyzeRequest } from '../utils/createAnalyzeRequest'
import { convertAbsoluteToRelativePath } from '../utils/convertAbsoluteToRelativePath'

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
                                    credentials.accessToken
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
                                console.log(compiled, 'compiled')

                                /*
								CREATE REQUEST OBJECT
							    */

                               let FILEPATH = fileUri.fsPath

                                                               /* 
                                    GET ROOTH PATH FOLDER
                                */

                               
                               // Windows OS hack
                               if (os.platform() === 'win32') {
                                   FILEPATH = FILEPATH.replace(/\\/g, '/')
                                   if (FILEPATH.charAt(0) === '/') {
                                       FILEPATH = FILEPATH.substr(1)
                                    }
                                }


                                // Remove file name from path
                                const rootPath = FILEPATH.substring(0, FILEPATH.lastIndexOf('/'))


                                let directoryPath = rootPath.replace(/\\/g, '/');
                                let rootDirectory: any = directoryPath.split('/');
                                rootDirectory = rootDirectory[rootDirectory.length - 1];



                                const contract =
                                    compiled.contracts[FILEPATH]

                                const sources = compiled.sources
                                console.log(sources, 'sources');
                                // source is required by our API but does not exist in solc output
                                sources[FILEPATH].source = fileContent

                                let newSources = {};
                                let sourcesKeys = Object.keys(compiled.sources);
                                sourcesKeys.map((key)=> {
                                  // Remove AST References
                                  if(compiled.sources[key].ast) {
                                      compiled.sources[key].ast.absolutePath = convertAbsoluteToRelativePath(compiled.sources[key].ast.absolutePath, directoryPath, rootDirectory);
                                  }
                                  if(compiled.sources[key].legacyAST) {
                                      compiled.sources[key].legacyAST.attributes.absolutePath = convertAbsoluteToRelativePath(compiled.sources[key].legacyAST.attributes.absolutePath, directoryPath, rootDirectory);
                                  }
                                  // Remap key
                                  newSources[convertAbsoluteToRelativePath(key, directoryPath, rootDirectory)] = compiled.sources[key];
                                })
                                

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
                                    convertAbsoluteToRelativePath(FILEPATH,directoryPath, rootDirectory),
                                    newSources,
                                    Object.keys(newSources),
                                    solcVersion,
                                    'quick',
                                )

                                console.log(requestMythx)

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
