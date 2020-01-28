import { AnalyzeOptions } from '../utils/types'
import { hasPlaceHolder } from '../utils/hasPlaceHolder'

export function createAnalyzeRequest(
    contractName,
    bytecode,
    deployedBytecode,
    mainSource,
    sources,
    compiled,
    solcVersion,
    analysisMode,
): AnalyzeOptions {
    return {
        toolName: 'mythx-vscode-extension',
        contractName: contractName,
        bytecode: hasPlaceHolder(bytecode.object),
        sourceMap: bytecode.sourceMap,
        deployedBytecode: hasPlaceHolder(deployedBytecode.object),
        deployedSourceMap: deployedBytecode.sourceMap,
        mainSource: mainSource,
        sources: sources,
        sourceList: Object.keys(compiled.sources),
        solcVersion: solcVersion,
        analysisMode: analysisMode,
    }
}
