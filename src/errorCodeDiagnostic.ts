import * as vscode from "vscode";
import { issueObj } from './utils/types'

export function errorCodeDiagnostic(document: vscode.TextDocument, collection: vscode.DiagnosticCollection, arrIssues: Array<issueObj>): void {
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