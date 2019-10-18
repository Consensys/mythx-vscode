import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { analyzeContract } from "./commands/analyzeContract";
import { runFullMode } from "./commands/runFullMode";
import { AAA } from "./commands/AAA"


let diagnosticsCollection: vscode.DiagnosticCollection

export async function activate(context: vscode.ExtensionContext) {
    ext.context = context;
    ext.outputChannel = vscode.window.createOutputChannel("MythX");

    diagnosticsCollection = vscode.languages.createDiagnosticCollection('mythx');

    vscode.commands.registerCommand("mythx.analyzeContract", async (fileUri: vscode.Uri) => {
        analyzeContract(diagnosticsCollection, fileUri)
    });

    vscode.commands.registerCommand("mythx.runFullMode", async () => {
        runFullMode(vscode.window.activeTextEditor.document.uri.fsPath)
    });

    vscode.commands.registerCommand("mythx.analyzeAll", async () => {
        // runFullMode(vscode.window.activeTextEditor.document.uri.fsPath)
        console.log('analyze allll')
         // Check if is folder, if not stop we need to output to a bin folder on rootPath
    if (vscode.workspace.workspaceFolders[0] === undefined) {
        vscode.window.showWarningMessage('Please open a folder in Visual Studio Code as a workspace');
        return;
    } else {
        console.log(vscode.workspace.workspaceFolders[0])
        vscode.window.showWarningMessage('jdjdjjd');
        let solidityPath = '**/*.sol';
        let excludePath = '**/bin/**';

        // Find all the other sol files, to compile them (1000 maximum should be enough for now)
    const files = vscode.workspace.findFiles(solidityPath, excludePath, 1000);


    files.then(
          res => {
             console.log(res, 'ree')
            // for (const file of res) {
            //       AAA(diagnosticsCollection, file.path)
            //     console.log('foo')
            //  }
            // const start = async () => {
            //     await asyncForEach(res, async (f)=>{
            //         console.log('before')
            //         AAA(diagnosticsCollection, f.path)
            //     })
            //  }
            //  start();
        }
    )

    files.then(
        async file => {
            console.log('file')
            await Promise.all(
                file.map(
                     f => {
                        console.log('bb')

                         AAA(diagnosticsCollection, f.path)
                        console.log('aaa')
                    }
                )
            )
            // file.forEach(
            //     async f => {
            //         console.log('beforee')
            //        await AAA(diagnosticsCollection, f.path)
            //        console.log('after')
            //        setTimeout(() => console.log('add'), 3000)
            //     }
            // )
        }
    )

    }
    });
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        console.log('ZIOO')
      await callback(array[index], index, array);
    }
  }