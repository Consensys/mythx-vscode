import * as vscode from "vscode";
import { Client } from "mythxjs"

import { getCredentials } from "../login/getCredentials"

import { errorCodeDiagnostic } from '../errorCodeDiagnostic'

import { AnalyzeOptions, Credentials } from "../utils/types"
import {  getFileContent } from "../utils/getFileContent"
import { getAstData } from '../utils/getAstData'

const { window } = vscode
let mythx: Client
let contractNameOption: vscode.InputBoxOptions = {
	prompt: "Contract Name: ",
	placeHolder: "Contract Name",
	ignoreFocusOut: true
}

export async function analyzeContract(diagnosticCollection: vscode.DiagnosticCollection, fileUri: vscode.Uri): Promise<void> {
	let contractName;

	await vscode.extensions.getExtension("JuanBlanco.solidity").activate().then(
		async (active) => {
			vscode.commands.executeCommand("solidity.compile.active").then(
				async done => {
					if(!done) {
						throw new Error(`MythX: Error with solc compilation.`)
					} else {
						const credentials: Credentials = await getCredentials();
						mythx = new Client(credentials.ethAddress, credentials.password, 'mythXvsc');

						await mythx.login();

						const fileContent = await getFileContent(fileUri)

						// Get contract names array for dropdown
						const contractNames = fileContent.match(/(?<=contract\s)(\w+)(?=\s*{)/g);

						await window.showQuickPick(contractNames, {
							canPickMany: false,
							placeHolder: 'Contract Name (please select main contract):'
						}).then(
							value => {
								if(value === undefined) {
									throw new Error('Contract Name cancelled. Please re-run analysis.');
								}
								contractName = value;
							}
						)

						const requestObj: AnalyzeOptions = await getAstData(contractName, fileContent);

						const analyzeRes = await mythx.analyze(
							requestObj,
						);

						const {uuid} = analyzeRes;
						// vscode.window.showInformationMessage(
						// 	`Your analysis has been submitted! Please see your results at
						// 	https://dashboard.mythx.io/#/console/analyses/${uuid}`
						// )

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
				}
			)
		},
		(err) =>{ throw new Error(`MythX: Error with solc compilation. ${err}`) }
	)
	
}
