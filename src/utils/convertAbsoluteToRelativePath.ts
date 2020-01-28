export function convertAbsoluteToRelativePath (rootPath, fixedPath) {
    let directoryPath = rootPath.replace(/\\/g, '/');
    let rootDirectory: any = directoryPath.split('/');
    rootDirectory = rootDirectory[rootDirectory.length - 1];

    let convertedPath = fixedPath.replace(directoryPath, '');
    convertedPath = '/' + rootDirectory + convertedPath;
    return convertedPath;
}