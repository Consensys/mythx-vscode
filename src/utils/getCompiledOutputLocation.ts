import * as vscode from "vscode";
const os = require('os');
const path = require('path')
const fs = require('fs');

export function getCompiledOutputLocation(): void {
    try {
        let outputAST
        let fixedPath = vscode.window.activeTextEditor.document.fileName;
        const roothPath = vscode.workspace.rootPath;
    
        // Windows OS hack
        if(os.platform() === 'win32') {
            fixedPath = fixedPath.replace(/\\/g, '/') 
            if (fixedPath.charAt(0) === '/') {
                fixedPath = fixedPath.substr(1);
            }
        }
        
        const fileName = fixedPath.split("/").pop();
        const fileNameTrimmed = fileName.replace('.sol', '')
    
    
        const pathNoFileName = fixedPath.substring(0, fixedPath.lastIndexOf("/"));
    
        // Find differences between two path
        const relativePath = path.relative(vscode.workspace.rootPath, pathNoFileName);
    
        if(pathNoFileName === roothPath) {
            outputAST = `${roothPath}/bin/${fileNameTrimmed}-solc-output.json`
        } else {
            outputAST = `${roothPath}/bin/${relativePath}/${fileNameTrimmed}-solc-output.json`
        }


        let doesFileExist = setInterval(() => {
            if(fs.existsSync(outputAST)) {
                clearInterval(doesFileExist);
            }
        }, 2000);

        // after 10 seconds we assume file was not compiled
        setTimeout(() => { 
            clearInterval(doesFileExist); console.log('stop timeout'); 
        }, 10000);

        if (!fs.existsSync(outputAST)) {
            throw new Error('Error with compiling the contract! Please try again or contact us.');
        }
    }        
    catch(err) {
        console.error(err)
    }
}