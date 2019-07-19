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
	placeHolder: "Contract Name",
	ignoreFocusOut: true
}

export async function analyzeContract(): Promise<void> {
	// await getCompiler()

	await vscode.extensions.getExtension("JuanBlanco.solidity").activate().then(
		(done) => {
			vscode.commands.executeCommand("solidity.compile.active");
			console.log(done, 'compilation worked')
		},
		(err) =>{ throw new Error(`Error with solc compilation. ${err}`) }
	)

	const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

	await waitFor(5000);

	await loginAndGetToken()

	let contractName;

	await window.showInputBox(contractNameOption).then(value => {
			if (value === undefined) {
					throw new Error('Contract Name cancelled. Please re-run analysis.');
			}
			contractName = value;
	})
		
	
	const fileContent = await getFileContent()
	
	const contractData = await analyzeAst(contractName, `${window.activeTextEditor.document.fileName}`, fileContent)

	// const contractData = await mythx.submitSourceCode(fileContent, contractName)

	const {uuid} = contractData

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
					console.log(analysis.status)
					if (analysis.status === "Finished") {
						clearInterval(timer)
						resolve("done")
					}
				}, 10000);
			}))
    
	const analysisResult = await mythx.getDetectedIssues(uuid)
	console.log('result', analysisResult)

	const { issues } = analysisResult[0];
	if(!issues) {
		vscode.window.showInformationMessage(`No security issues found in your contract.`);
	}
	vscode.window.showWarningMessage(`Mythx found ${issues.length} security issues with contract.`);

	// Diagnostic
	const collection = vscode.languages.createDiagnosticCollection('test');

	errorCodeDiagnostic(vscode.window.activeTextEditor.document, collection, analysisResult);
}

async function analyzeAst(contractName: string, filePath: string, fileContent) {
	try {
		const trimmed = filePath.split("/").pop().slice(0, -4)
		const pathNoFileName = filePath.substring(0, filePath.lastIndexOf("/"));

		const outputAST = `${pathNoFileName}/bin/${trimmed}-solc-output.json`

		const documentObj = await vscode.workspace.openTextDocument(outputAST)
		const compiled = JSON.parse(documentObj.getText());

		const contract = compiled.contracts[filePath]
		
		const sources = compiled.sources
		sources[filePath].source = fileContent

		// Data to submit
		const bytecodeObj = contract[contractName].evm.bytecode
		const deployedBytecodeObj = contract[contractName].evm.deployedBytecode

		let bytecode = bytecodeObj.object;
		const {sourceMap} = bytecodeObj;

		const metadata = JSON.parse(contract[contractName].metadata)
		const solcVersion = metadata.compiler.version

		// const {metadata} = JSON.parse(contract[contractName])
		// console.log(metadata.compiler.version, 'meta')

		// Check if bytecode contains placeholder
		if(bytecode.includes("__$")) {
			bytecode = bytecode.replace(/__\$(.+)\$__/, (m,p) => Array(p.length).fill(0).join('') )
		}

		const request = {
				toolName: "mythx-vscode-extension",
				contractName: contractName,
				bytecode: bytecode,
				sourceMap: sourceMap,
				deployedBytecode: deployedBytecodeObj.object,
				deployedSourceMap: deployedBytecodeObj.sourceMap,
				mainSource: filePath,
				sources: sources,
				sourceList: [filePath], // TODO: GET OBJECT KEYS,
				solcVersion: solcVersion
		}
		console.log(request, 'request')
		const result = await mythx.analyze(
			request
		)

		console.log(result)
		return result
	
	} catch(err) {
		console.log(err, 'err')
		vscode.window.showWarningMessage(`Mythx error with analysing your AST. ${err}`);
	}
}