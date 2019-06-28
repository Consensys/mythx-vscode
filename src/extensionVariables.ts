import { IAzureUserInput, AzureTreeDataProvider } from "vscode-azureextensionui";
import { ExtensionContext, OutputChannel } from "vscode";

export namespace ext {
    export let context: ExtensionContext;
    export let tree: AzureTreeDataProvider;
    export let outputChannel: OutputChannel;
    export let ui: IAzureUserInput;
}
