import * as vscode from "vscode";
import { Client } from "mythxjs"

import { getCredentials } from "../login/getCredentials"

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

export async function runFullMode(fileUri: string): Promise<void> {
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

						const documentObj = await vscode.workspace.openTextDocument(fileUri)
    						const fileContent = documentObj.getText();

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

						const requestObj: AnalyzeOptions = await getAstData(contractName, fileContent, 'full');

						const analyzeRes = await mythx.analyze(
							requestObj,
						);

						const {uuid} = analyzeRes;
						vscode.window.showInformationMessage(
							`Your analysis has been submitted! Please see your results at
							https://dashboard.mythx.io/#/console/analyses/${uuid}`, 'Dismiss'
						).then(
							x => {return}
						)
						return;
					}
				}
			)
		},
		(err) =>{ throw new Error(`MythX: Error with solc compilation. ${err}`) }
	)
	
}
