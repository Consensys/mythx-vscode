import * as vscode from "vscode";
import { Client } from "mythxjs"
const path = require('path');

import { getCredentials } from "../login/getCredentials"
import { AnalyzeOptions, Bytecode, Credentials } from "../utils/types"
import { hasPlaceHolder } from '../utils/hasPlaceHolder'

let mythx: Client

export async function runAnalyzeAll(diagnosticCollection): Promise<void> {
    try {
        let contractName;
        vscode.extensions.getExtension("JuanBlanco.solidity").activate().then(
            async (active) => {
                const credentials: Credentials = await getCredentials();
                const projectConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('mythxvsc');
                let environment: string = 'https://api.mythx.io/v1/"'

                if(projectConfiguration.environment) {
                    environment = projectConfiguration.environment
                }

                mythx = new Client(credentials.ethAddress, credentials.password, 'mythXvsc', environment);

                await mythx.login();

                // Check if is folder, if not stop we need to output to a bin folder on rootPath
                if (vscode.workspace.workspaceFolders[0] === undefined) {
                    vscode.window.showWarningMessage('Please open a folder in Visual Studio Code as a workspace');
                    return;
                } else {
                    vscode.window.showInformationMessage('Starting analyzing all files');
                    let solidityPath = '**/*.sol';
                    let excludePath = '**/bin/**';

                    vscode.commands.executeCommand("solidity.compile").then(
                        async done => {
                            const files = vscode.workspace.findFiles(solidityPath, excludePath, 1000);

                            // TODO: GET BELOW OUTPUT VALUE RELATIVE TO FOLDER
                            const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                            const outputAST =  path.join(rootPath, 'bin/solc-output-compile-all.json')
                            const documentObj = await vscode.workspace.openTextDocument(outputAST)
                            const compiled = JSON.parse(documentObj.getText());

                            const group = await mythx.createGroup()

                            files.then(
                                async file => {
                                    file.forEach(
                                    async (f: any) => {
                                        let fileContent;

                                        const contract = compiled.contracts[f.fsPath]
                                        
                                        // Make sure that only analyzes compiled contracts
                                        if(contract) {
                                            let data;

                                            const contracts = Object.keys(contract)

                                            if (contracts.length === 0) {
                                                    throw new Error('No contracts found');
                                            } else if (contracts.length === 1) {
                                                contractName = Object.keys(contract)[0];
                                                data = contract[contractName];

                                                const sources = compiled.sources

                                                // source is required by our API but does not exist in solc output
                                                sources[f.fsPath].source = fileContent

                                                // // Bytecode
                                                const bytecode: Bytecode = contract[contractName].evm.bytecode
                                                const deployedBytecode: Bytecode = contract[contractName].evm.deployedBytecode

                                                // Metadata
                                                const metadata = JSON.parse(contract[contractName].metadata)
                                                const solcVersion = metadata.compiler.version
                                                
                                                const requestObj: AnalyzeOptions = createAnalyzeRequest(
                                                    contractName,
                                                    bytecode,
                                                    deployedBytecode,
                                                    f.fsPath,
                                                    sources,
                                                    compiled,
                                                    solcVersion,
                                                    'quick',
                                                    group.id
                                                )

                                                const analyzeRes = await mythx.analyze(
                                                    requestObj,
                                                );
                                                
                                                const { uuid } = analyzeRes;
                                                vscode.window.showInformationMessage(
                                                    `Your analysis has been submitted! Wait for vscode linting or see detailed results at
                                                    https://dashboard.mythx.io/#/console/analyses/${uuid}`, 'Dismiss'
                                                ).then(
                                                    x => { return }
                                                )
                                            }
                                        }
                                    })
                                }
                            )
                        }
                    )
                }
            },
            (err) =>{ throw new Error(`MythX: Error with solc compilation. ${err}`) }
        )
    } 
    catch(err) {
        vscode.window.showErrorMessage(
            `MythXvsc: ${err}`
        ) 
    }
}

function createAnalyzeRequest (contractName, bytecode, deployedBytecode, fixedPath, sources, compiled, solcVersion, analysisMode, groupId): AnalyzeOptions {
	return {
		toolName: "mythx-vscode-extension",
		contractName: contractName,
		bytecode: hasPlaceHolder(bytecode.object),
		sourceMap: bytecode.sourceMap,
		deployedBytecode: hasPlaceHolder(deployedBytecode.object),
		deployedSourceMap: deployedBytecode.sourceMap,
		mainSource: fixedPath,
		sources: sources,
		sourceList: Object.keys(compiled.sources),
		solcVersion,
        analysisMode,
        groupId
	}

}