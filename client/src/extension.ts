import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import { ObjectDectectionEditorProvider } from "./customEditor";

let nodeProcess = undefined;

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join("server", "server.js"));

  nodeProcess = cp.exec(`node ${serverModule}`, (error, stdout, stderr) => {
    if (error) {
      console.log(error.stack);
      console.log("Error code: " + error.code);
      console.log("Signal received: " + error.signal);
    }
  });

  context.subscriptions.push(ObjectDectectionEditorProvider.register(context));
}

export function deactivate(): Thenable<void> | undefined {
  if (nodeProcess) {
    nodeProcess.kill("SIGINT");
  }
  return Promise.resolve();
}
