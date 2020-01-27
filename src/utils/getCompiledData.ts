import * as vscode from "vscode";

const os = require('os');
const path = require('path')

export async function getCompiledData(fileUri: vscode.Uri) {
	try {
		let outputAST

		const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
		console.log(rootPath, 'root')

        let FILEPATH = fileUri.fsPath
		console.log(FILEPATH, 'FILEPATH')

		// Windows OS hack
		if(os.platform() === 'win32') {
			FILEPATH = FILEPATH.replace(/\\/g, '/') 
			if (FILEPATH.charAt(0) === '/') {
				FILEPATH = FILEPATH.substr(1);
			}
        }
        
        // Remove file name from path
        const fileName = FILEPATH.split("/").pop();		
        const fileNameTrimmed = fileName.replace('.sol', '')
		const pathNoFileName = FILEPATH.substring(0, FILEPATH.lastIndexOf("/"));

		// Find differences between two path
		const relativePath = path.relative(rootPath, pathNoFileName);

		if (pathNoFileName === rootPath) {
            outputAST = path.join(rootPath, 'bin', `${fileNameTrimmed}-solc-output.json`);
        } else {
            outputAST =  path.join(rootPath, 'bin', relativePath, `${fileNameTrimmed}-solc-output.json`);
		}
		
		const documentObj = await vscode.workspace.openTextDocument(outputAST)
        const compiled = JSON.parse(documentObj.getText());

        return compiled;
	} catch(err) {
		vscode.window.showWarningMessage(`Mythx error with analysing your AST. ${err}`);
		throw new Error(`Mythx error with analysing your AST. ${err}`)
	}
}