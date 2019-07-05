import * as vscode from "vscode";
import { Client } from "mythxjs"

import { errorCodeDiagnostic } from '../errorCodeDiagnostic'

import { JwtTokensInterface, issueObj } from "../utils/types"
import {  getFileContent } from "../utils/getFileContent"
import { getCompiler } from "../utils/getCompiler"
import { MYTHX_USER, MYTHX_PASSWORD} from '../constants'

const { window } = vscode

let mythx: Client;

async function loginAndGetToken() {
    try {

		mythx = new Client(MYTHX_USER, MYTHX_PASSWORD);
		
    const token: JwtTokensInterface = await mythx.login()
		const {access} = token
		
    return access 
    } catch(err) {
				vscode.window.showWarningMessage(`MythXCode Error with running the extension. ${err}`);
				throw new Error('Error with running extension.')
    }
}

let contractNameOption: vscode.InputBoxOptions = {
	prompt: "Contract Name: ",
	placeHolder: "Contract Name"
}

export async function analyzeContract(): Promise<void> {
	await getCompiler()

	const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

	await waitFor(5000);

	await loginAndGetToken()


	const contractName = await window.showInputBox(contractNameOption)
	
	// await analyzeAst(contractName)

	const fileContent = await getFileContent()

	const contractData = await mythx.submitSourceCode(fileContent, contractName)
	
	window.showInformationMessage(`Start analysing smart contract ${window.activeTextEditor.document.fileName} `)


	const {uuid} = contractData

  // Get in progress bar
	await window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: "Analysing smart contract",
			cancellable: true
		},
		(_) => new Promise(
			(resolve) => {
				// Handle infinite queue
				const timer = setInterval(async () => {
					const analysis = await mythx.getAnalysisStatus(uuid)
					console.log(analysis.status)
					if (analysis.status === "Finished") {
						clearInterval(timer)
						resolve("done")
					}
				}, 10000);
			}))
    
	const analysisResult = await mythx.getDetectedIssues(uuid)

	console.log(analysisResult)

	const { issues } = analysisResult[0];
	console.log(issues.length)
	vscode.window.showWarningMessage(`Mythx found ${issues.length} security warning with contract.`);

	// Diagnostic
	const collection = vscode.languages.createDiagnosticCollection('test');

	errorCodeDiagnostic(vscode.window.activeTextEditor.document, collection, issues);
}

async function analyzeAst(contractName: string, fileName: string) {
	try {
		const contractNameLow = contractName.toLowerCase()
		console.log('analyzeAst', `${vscode.workspace.rootPath}/bin/${contractNameLow}-sol-output.json`)
		const documentObj = await vscode.workspace.openTextDocument(`${vscode.workspace.rootPath}/bin/${contractNameLow}-sol-output.json`)
		const content = JSON.parse(documentObj.getText());
		// console.log(content, 'parsed')
		// console.log(`${vscode.workspace.rootPath}/${contractName}.sol`, 'path')
		const contract = content.contracts[`${vscode.workspace.rootPath}/${contractName}.sol`]
		console.log(contract, 'contract')
		const bytecode = contract.evm.bytecode;
		const deployedBytecode = contract.evm.deployedBytecode;
		
		console.log(bytecode, deployedBytecode)
	
	} catch(err) {
		vscode.window.showWarningMessage(`Mythx error with your request. ${err}`);
	}
}