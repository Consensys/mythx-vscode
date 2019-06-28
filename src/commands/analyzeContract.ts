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

	const access = await loginAndGetToken()


	const contractName = await window.showInputBox(contractNameOption)

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

	// errorCodeDiagnostic(issues)
	updateDiagnostics(vscode.window.activeTextEditor.document, collection, issues);

		// Set HTML content
	// panel.webview.html = getWebviewContent(analysisResult);
}


function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection, arrIssues: Array<issueObj>): void {
	let diagnostics: vscode.Diagnostic[] = [];

	arrIssues.map(
		issue => {
				let position = {
						start: {
								line: undefined,
								column: undefined
						},
						end: {
								line: undefined,
								column: undefined
						}
				}
				const {decodedLocations} = issue
				// TODO: all the below should be better extracted
				if(decodedLocations) {
					decodedLocations.map(
						locations => {
							// vscode diagnostics starts from 0
							position.start.line = locations[0].line - 1;
							position.start.column = locations[0].column;
							position.end.line = locations[1].line - 1;
							position.end.column = locations[1].column;
							let message = `${issue.swcID}. ${issue.description.head}`;
							let range = new vscode.Range(new vscode.Position(position.start.line, position.start.column), new vscode.Position(position.end.line, position.end.column))
							// let severity = item.severity.toLowerCase() === "warning" ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error;
							let severity = vscode.DiagnosticSeverity.Error;
							let relatedInformation = ''
							let diagnostic = new vscode.Diagnostic(range, message, severity);
							diagnostics.push(diagnostic);
						}
					)
				}

				console.log('location.start.line', issue.decodedLocations[0][0].line)
				console.log('location.start.column', issue.decodedLocations[0][0].column)
				console.log('location.end.line', issue.decodedLocations[0][1].line)
				console.log('location.end.column', issue.decodedLocations[0][1].column)
				console.log(`${issue.swcID}. ${issue.description.head}`)
		}
)
collection.set(document.uri, diagnostics)
}