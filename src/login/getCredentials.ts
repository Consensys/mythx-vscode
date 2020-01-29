import * as vscode from "vscode";
import { Credentials } from "../utils/types";

export async function getCredentials(): Promise<Credentials> {
	const {window} = vscode
    try {
		let ethAddress = "0x0000000000000000000000000000000000000000"
		let password = "trial"
		let accessToken
		const projectConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('mythxvsc');

		if(projectConfiguration.ethAddress && projectConfiguration.password) {
			ethAddress = projectConfiguration.ethAddress
			password = projectConfiguration.password
		} else if (projectConfiguration.accessToken){
			accessToken = projectConfiguration.accessToken
		}
		else {
			window.showInformationMessage("No user settings found for EthAddress and password. Trial user will be soon deprecated.")
		}

		return {
			ethAddress,
			password,
			accessToken
		}
	
    } catch(err) {
		throw new Error(`MythXvs Error with getting credentials. ${err}.`)
    }
}