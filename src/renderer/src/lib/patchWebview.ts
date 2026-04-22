// Electron's webview shadow-root contains an <iframe> with no explicit height.
// Without this patch the webview content does not fill its container.
export function patchWebviewIframeHeight(webview: Electron.WebviewTag): void {
  const innerIframe = webview.shadowRoot?.querySelector("iframe");
  if (innerIframe) {
    innerIframe.style.height = "100%";
  }
}
