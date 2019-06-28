import * as vscode from "vscode";

interface descriptionObj {
    head: string
    tail: string
    // Make below a mapping of severity warnings
    severity: string
}

interface decodedLocationsObj {
    line: number
    column: number
}
interface issueObj {
    swcID:string
    swcTitle:string
    description:descriptionObj
    severity:"Low"
    locations:Array<any>
    extra: any
    decodedLocations?:Array<Array<decodedLocationsObj>>
}

export function errorCodeDiagnostic(arrIssues: Array<issueObj>) {
    const diagnosticsCollection = vscode.languages.createDiagnosticCollection('test');
    vscode.window.onDidChangeActiveTextEditor(e => {
        if (e && e.document) {
            const diagnostics: vscode.Diagnostic[] = [];

            const { Diagnostic, Range, Position, DiagnosticSeverity } = vscode

             arrIssues.map(
                issue => {
                    let location = {
                        start: {
                            line: undefined,
                            column: undefined
                        },
                        end: {
                            line: undefined,
                            column: undefined
                        }
                    }
                    // TODO: all the below should be better extracted
                    if(issue.decodedLocations) {
                        location.start.line = issue.decodedLocations[0][0].line;
                        location.start.column = issue.decodedLocations[0][0].column;
                        location.end.line = issue.decodedLocations[0][1].line;
                        location.end.column = issue.decodedLocations[0][1].column;
                    }
                    console.log('location.start.line', issue.decodedLocations[0][0].line)
                    console.log('location.start.column', issue.decodedLocations[0][0].column)
                    console.log('location.end.line', issue.decodedLocations[0][1].line)
                    console.log('location.end.column', issue.decodedLocations[0][1].column)
                    console.log(`${issue.swcID}. ${issue.description.head}`)
                    diagnostics.push(new Diagnostic(new Range
                        (new Position(location.start.line, 23), new Position(location.end.line, location.end.column)), 
                        `${issue.swcID}. ${issue.description.head}`, 
                        DiagnosticSeverity.Error))
                }
            )

            // console.log(diagnosticsArr, 'arrrss')

            // let diag = new Diagnostic(new Range
            //     (new Position(12, 0), new Position(12, 22)), 
            //     `The binary subtraction can underflow.`, 
            //     DiagnosticSeverity.Error);


            // let firstWarn = new Diagnostic(new Range(new Position(13, 0), new Position(13, 10)), `The binary addition can overflow`, DiagnosticSeverity.Error);
            // let secondWarn = new Diagnostic(new Range(new Position(0, 0), new Position(0, 30)), `MythX API Trial Mode`, DiagnosticSeverity.Warning);

            // diagnostics.push(diag, firstWarn, secondWarn);
            diagnosticsCollection.set(e.document.uri, diagnostics);
        }
    });
}




function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection, arrIssues: Array<issueObj>): void {
    collection.set(document.uri, [{
        code: '',
        message: 'cannot assign twice to immutable variable `x`',
        range: new vscode.Range(new vscode.Position(3, 4), new vscode.Position(3, 20)),
        severity: vscode.DiagnosticSeverity.Error,
        source: '',
        relatedInformation: [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`')
        ]
    }]);
}