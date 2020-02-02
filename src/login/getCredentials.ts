import * as vscode from 'vscode'
import { Credentials } from '../utils/types'

export async function getCredentials(): Promise<Credentials> {
    const { window } = vscode
    try {
        let ethAddress = '0x0000000000000000000000000000000000000000'
        let password = 'trial'
        let accessToken
        const projectConfiguration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(
            'mythxvsc',
        )

        if (projectConfiguration.accessToken) {
            accessToken = projectConfiguration.accessToken
        } else if (
            projectConfiguration.ethAddress &&
            projectConfiguration.password
        ) {
            ethAddress = projectConfiguration.ethAddress
            password = projectConfiguration.password
        } else {
            window.showWarningMessage(
                'No user settings found for EthAddress and password or access token. Please register an account on www.mythx.io',
            )
        }

        return {
            ethAddress,
            password,
            accessToken,
        }
    } catch (err) {
        throw new Error(`Error with getting credentials. ${err}.`)
    }
}
