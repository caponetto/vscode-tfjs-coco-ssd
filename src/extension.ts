import * as vscode from "vscode";
import { ObjectDectectionEditorProvider } from "./objectDetectionEditor";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(ObjectDectectionEditorProvider.register(context));
}
