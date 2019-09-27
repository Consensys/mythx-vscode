import * as vscode from "vscode";
const os = require('os');
const path = require('path')
const fs = require('fs');

export function getCompiledOutputLocation(): string {
    try {
        let outputAST: string
        let fixedPath = vscode.window.activeTextEditor.document.fileName;
        const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
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
    
        if (pathNoFileName === rootPath) {
            outputAST = path.join(rootPath, 'bin', `${fileNameTrimmed}-solc-output.json`);
        } else {
            outputAST =  path.join(rootPath, 'bin', relativePath, `${fileNameTrimmed}-solc-output.json`);
        }

        return outputAST;
    }        
    catch(err) {
        throw  new Error(`MythXvsc problem with getting compiled location: ${err}`)
    }
}