import { useEffect, useRef, useState } from "react";
import { patchWebviewIframeHeight } from "../lib/patchWebview";
import {
  FULLSCREEN_INJECT_SCRIPT,
  FULLSCREEN_Z_INDEX,
  registerFullscreenListeners
} from "../lib/webviewFullscreen";

const TERMINAL_BORDER_RADIUS = 4;

interface TerminalProps {
  id: string;
  shell: string;
  scrollLocked: boolean;
}

export default function Terminal({ id, shell, scrollLocked }: TerminalProps): React.JSX.Element {
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const terminalPageUrl = new URL("terminal.html", window.location.href).href;
  const src = `${terminalPageUrl}?id=${encodeURIComponent(id)}&shell=${encodeURIComponent(shell)}`;

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = (): void => {
      patchWebviewIframeHeight(webview);
      webview.executeJavaScript(FULLSCREEN_INJECT_SCRIPT).catch(() => undefined);
    };

    const detachFullscreen = registerFullscreenListeners(webview, setIsFullscreen);

    webview.addEventListener("dom-ready", handleDomReady);
    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      detachFullscreen();
    };
  }, []);

  // Forward terminal data from the main renderer to the webview.
  // The PTY broadcasts via BrowserWindow.getAllWindows() which reaches this renderer;
  // the webview has its own context and must receive data via webview.send().
  useEffect(() => {
    const removeDataListener = window.api.onTerminalData((dataId, data) => {
      if (dataId !== id) return;
      webviewRef.current?.send("terminal:data", { id: dataId, data });
    });
    return removeDataListener;
  }, [id]);

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: "fixed",
        inset: 0,
        zIndex: FULLSCREEN_Z_INDEX,
        borderRadius: 0,
        overflow: "hidden",
        pointerEvents: "auto"
      }
    : {
        width: "100%",
        height: "100%",
        borderRadius: TERMINAL_BORDER_RADIUS,
        overflow: "hidden",
        pointerEvents: scrollLocked ? "none" : "auto"
      };

  const webviewStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
    border: "none"
  };

  return (
    <div style={containerStyle}>
      <webview
        ref={webviewRef}
        src={src}
        preload={window.api.terminalPreloadPath}
        style={webviewStyle}
      />
    </div>
  );
}
