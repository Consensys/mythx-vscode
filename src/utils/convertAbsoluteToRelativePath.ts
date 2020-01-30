export function convertAbsoluteToRelativePath (source, directoryPath, rootDirectory) {
    source = source.replace(directoryPath, '');
    source = '/' + rootDirectory + source;
    source = source.toLowerCase();
    source = source.replace(directoryPath.toLowerCase(), '');
    source = '/' + rootDirectory.toLowerCase() + source;
    return source;
  }
  