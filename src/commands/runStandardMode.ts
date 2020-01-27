import * as vscode from 'vscode'
import { Client } from 'mythxjs'

import { getCredentials } from '../login/getCredentials'

import { AnalyzeOptions, Credentials, Bytecode } from '../utils/types'
import { getFileContent } from '../utils/getFileContent'
import { getContractName } from '../utils/getContractName'
import { getCompiledData } from '../utils/getCompiledData'

import { hasPlaceHolder } from '../utils/hasPlaceHolder'

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
                                console.log(fileUri, 'FILE')
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

                                const contract =
                                    compiled.contracts[fileUri.fsPath]

                                const sources = compiled.sources

                                // source is required by our API but does not exist in solc output
                                sources[fileUri.fsPath].source = fileContent

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
                                    fileUri.fsPath,
                                    sources,
                                    compiled,
                                    solcVersion,
                                    'full',
                                )

                                const analyzeRes = await mythx.analyze(
                                    requestMythx,
                                )

                                const { uuid } = analyzeRes
                                vscode.window
                                    .showInformationMessage(
                                        `Your analysis has been submitted! Wait for vscode linting or see detailed results at
								https://dashboard.mythx.io/#/console/analyses/${uuid}`,
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
                                        `MythXvs: No security issues found in your contract.`,
                                    )
                                } else {
                                    vscode.window.showWarningMessage(
                                        `MythXvs: found ${filtered.length} security issues with contract.`,
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

// TODO: MOVE BELOW TO DIFFERENT FILE
function createAnalyzeRequest(
    contractName,
    bytecode,
    deployedBytecode,
    mainSource,
    sources,
    compiled,
    solcVersion,
    analysisMode,
): AnalyzeOptions {
    return {
        toolName: 'mythx-vscode-extension',
        contractName: contractName,
        bytecode: hasPlaceHolder(bytecode.object),
        sourceMap: bytecode.sourceMap,
        deployedBytecode: hasPlaceHolder(deployedBytecode.object),
        deployedSourceMap: deployedBytecode.sourceMap,
        mainSource: mainSource,
        sources: sources,
        sourceList: Object.keys(compiled.sources),
        solcVersion: solcVersion,
        analysisMode: analysisMode,
    }
}
