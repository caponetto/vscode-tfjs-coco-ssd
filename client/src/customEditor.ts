import * as path from "path";
import * as vscode from "vscode";

export class ObjectDectectionEditorProvider
  implements vscode.CustomReadonlyEditorProvider<ImageDocument> {
  public constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      "objectDetection",
      new ObjectDectectionEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
  }

  public async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    token: vscode.CancellationToken
  ): Promise<ImageDocument> {
    return await ImageDocument.create(uri);
  }

  public async resolveCustomEditor(
    document: ImageDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    webviewPanel.webview.onDidReceiveMessage((e) => {
      if (e.type === "ready") {
        this.postMessage(webviewPanel, "init", {
          path: document.uri.fsPath,
          content: document.content,
          endpoint: "http://localhost:3000/detect",
        });
      }
    });
  }

  private postMessage(
    panel: vscode.WebviewPanel,
    type: string,
    body: any
  ): void {
    panel.webview.postMessage({ type, body });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "client", "media", "editor.js")
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "client", "media", "editor.css")
      )
    );

    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src *; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-eval';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet" />
        <title>Object detection</title>
      </head>
      <body>
        <div class="canvas">
          <div class="spinner">
            <div class="cube1"></div>
            <div class="cube2"></div>
          </div>
        </div>
        <script nonce="${nonce}" src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
        <script nonce="${nonce}" src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.1.0"></script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

class ImageDocument implements vscode.CustomDocument {
  private readonly _onDidDispose = new vscode.EventEmitter<void>();
  public readonly onDidDispose = this._onDidDispose.event;

  private constructor(
    public readonly uri: vscode.Uri,
    public readonly content: Uint8Array
  ) {}

  public dispose(): void {
    this._onDidDispose.fire();
    this._onDidDispose.dispose();
  }

  public static async create(
    uri: vscode.Uri
  ): Promise<ImageDocument | PromiseLike<ImageDocument>> {
    const fileData = await vscode.workspace.fs.readFile(uri);
    return new ImageDocument(uri, fileData);
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
