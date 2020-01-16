import * as vscode from "vscode";
import { Client } from "mythxjs"

import { getCredentials } from "../login/getCredentials"

import { errorCodeDiagnostic } from '../errorCodeDiagnostic'

import { AnalyzeOptions, Credentials } from "../utils/types"
import { getFileContent } from "../utils/getFileContent"
import { getAstData } from '../utils/getAstData'
import { getContractName } from "../utils/getContractName";

const { window } = vscode
let mythx: Client

export async function analyzeContract(diagnosticCollection: vscode.DiagnosticCollection, fileUri): Promise<void> {

	await vscode.extensions.getExtension("JuanBlanco.solidity").activate().then(
		async (active) => {
			vscode.commands.executeCommand("solidity.compile.active").then(
				async done => {
					try {
						if (!done) {
							throw new Error(`MythX: Error with solc compilation.`)
						} else {
							const credentials: Credentials = await getCredentials();
							const projectConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('mythxvsc');
							let environment: string = 'https://api.mythx.io/v1/"'
							if(projectConfiguration.environment) {
								environment = projectConfiguration.environment
							}

							mythx = new Client(credentials.ethAddress, credentials.password, 'mythXvsc', environment);

							await mythx.login();

							const fileContent = await getFileContent(fileUri)

							// Get contract names array for dropdown
							// const contractNames = fileContent.match(/(?<=contract\s)(\w+)(?=\s*{)/g);

							const contractName = await getContractName(fileUri)


							const requestObj: AnalyzeOptions = await getAstData(contractName, fileContent);

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

							// Get in progress bar
							await window.withProgress(
								{
									cancellable: true,
									location: vscode.ProgressLocation.Notification,
									title: `Analysing smart contract ${contractName}`,

								},
								(_) => new Promise(
									(resolve) => {
										// Handle infinite queue
										const timer = setInterval(async () => {
											const analysis = await mythx.getAnalysisStatus(uuid);
											if (analysis.status === 'Finished') {
												clearInterval(timer);
												resolve('done');
											}
										}, 10000);
									}));

							diagnosticCollection.clear();
							const analysisResult = await mythx.getDetectedIssues(uuid);

							const { issues } = analysisResult[0];

							// Some warning have messages but no SWCID (like free trial user warn)
							const filtered = issues.filter(
								issue => issue.swcID !== '',
							);
							if (!filtered) {
								vscode.window.showInformationMessage(`MythXvs: No security issues found in your contract.`);
							} else {
								vscode.window.showWarningMessage(`MythXvs: found ${filtered.length} security issues with contract.`);
							}

							// Diagnostic
							errorCodeDiagnostic(vscode.window.activeTextEditor.document, diagnosticCollection, analysisResult);
						}
					} catch (err) {
						vscode.window.showErrorMessage(
							`MythXvsc: ${err}`
						)
					}
				}
			)
		},
		(err) => { throw new Error(`MythX: Error with solc compilation. ${err}`) }
	)

}
