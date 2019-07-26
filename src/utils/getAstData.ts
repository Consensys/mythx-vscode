import * as vscode from "vscode";

import { Bytecode, AnalyzeOptions } from "../utils/types"
import { hasPlaceHolder } from '../utils/hasPlaceHolder'

export async function getAstData(contractName: string, filePath: string, fileContent): Promise<AnalyzeOptions>  {
	try {

		let folderPath = vscode.workspace.rootPath; // get the open folder path

		// Windows OS fix
		const fixedPath = filePath.replace(/\\/g, '/') 

		// TODO: refactor getting file name
		const trimmed = fixedPath.split("/").pop().replace('.sol', '')

		const outputAST = `${folderPath}/bin/${trimmed}-solc-output.json`

		const documentObj = await vscode.workspace.openTextDocument(outputAST)
		const compiled = JSON.parse(documentObj.getText());

		const contract = compiled.contracts[fixedPath]
		
		const sources = compiled.sources

		// source is required by our API but does not exist in solc output
		sources[fixedPath].source = fileContent

		// Data to submit

		// Bytecode
		const bytecode: Bytecode = contract[contractName].evm.bytecode
		const deployedBytecode: Bytecode = contract[contractName].evm.deployedBytecode

		// Metadata
		const metadata = JSON.parse(contract[contractName].metadata)
		const solcVersion = metadata.compiler.version

		const request: AnalyzeOptions = {
				toolName: "mythx-vscode-extension",
				contractName: contractName,
				bytecode: hasPlaceHolder(bytecode.object),
				sourceMap: bytecode.sourceMap,
				deployedBytecode: hasPlaceHolder(deployedBytecode.object),
				deployedSourceMap: deployedBytecode.sourceMap,
				mainSource: fixedPath,
				sources: sources,
				sourceList: Object.keys(compiled.sources),
				solcVersion: solcVersion
		}

		return request
	
	} catch(err) {
		vscode.window.showWarningMessage(`Mythx error with analysing your AST. ${err}`);
		throw new Error(`Mythx error with analysing your AST. ${err}`)
	}
}