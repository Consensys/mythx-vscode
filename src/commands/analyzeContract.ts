import * as vscode from "vscode";
import { Client } from "mythxjs"

import { getCredentials } from "../login/getCredentials"

import { errorCodeDiagnostic } from '../errorCodeDiagnostic'

import { AnalyzeOptions, Credentials } from "../utils/types"
import {  getFileContent } from "../utils/getFileContent"
import { getAstData } from '../utils/getAstData'
import { getCompiledOutputLocation } from "../utils/getCompiledOutputLocation";

const fs = require('fs')

const { window } = vscode
let mythx: Client
let contractNameOption: vscode.InputBoxOptions = {
	prompt: "Contract Name: ",
	placeHolder: "Contract Name",
	ignoreFocusOut: true
}

export async function analyzeContract(diagnosticCollection: vscode.DiagnosticCollection): Promise<void> {
	let contractName;

	// TODO: throw errror if compilation fails 
	await vscode.extensions.getExtension("JuanBlanco.solidity").activate().then(
		async (done) => {
			vscode.commands.executeCommand("solidity.compile.active");
		},
		(err) =>{ throw new Error(`MythX: Error with solc compilation. ${err}`) }
	)
		
	const compiledLocation = getCompiledOutputLocation()

    let doesFileExist = setInterval( async() => {
		if(fs.existsSync(compiledLocation)) {
			clearInterval(doesFileExist);
			const credentials: Credentials = await getCredentials()

			mythx = new Client(credentials.ethAddress, credentials.password, "mythXvsc");

			await mythx.login()

			await window.showInputBox(contractNameOption).then(value => {
					if (value === undefined) {
						throw new Error('Contract Name cancelled. Please re-run analysis.');
					}
					contractName = value;
			})
			
			const fileContent = await getFileContent()
			
			const requestObj: AnalyzeOptions = await getAstData(contractName, fileContent)
			
			const analyzeRes = await mythx.analyze(
				requestObj
			)

			const {uuid} = analyzeRes

			// Get in progress bar
			await window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Analysing smart contract ${contractName}`,
				cancellable: true
			},
			(_) => new Promise(
				(resolve) => {
					// Handle infinite queue
					const timer = setInterval(async () => {
						const analysis = await mythx.getAnalysisStatus(uuid)
						if (analysis.status === "Finished") {
							clearInterval(timer)
							resolve("done")
						}
					}, 10000);
				}))
		
			const analysisResult = await mythx.getDetectedIssues(uuid)

			const { issues } = analysisResult[0];
			
			// Some warning have messages but no SWCID (like free trial user warn)
			const filtered = issues.filter(
				issue => issue.swcID !== ""
			)
			if(!filtered) {
				vscode.window.showInformationMessage(`MythXvs: No security issues found in your contract.`);
			} else {
				vscode.window.showWarningMessage(`MythXvs: found ${filtered.length} security issues with contract.`);
			}

			// Diagnostic
			errorCodeDiagnostic(vscode.window.activeTextEditor.document, diagnosticCollection, analysisResult);

		}
	}, 2000);

	// after 10 seconds we assume file was not compiled
	setTimeout(() => { 
		clearInterval(doesFileExist);
		if (!fs.existsSync(compiledLocation)) {
			vscode.window.showWarningMessage(`MythXvsc: Error with compiling the contract! Please try again or contact us.`);
			throw new Error('Error with compiling the contract! Please try again or contact us.');
		}
	}, 10000);
}
