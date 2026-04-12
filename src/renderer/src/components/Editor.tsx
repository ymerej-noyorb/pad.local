import { useEffect, useRef, useState } from "react";
import { colorsByTheme } from "../theme";
import Spinner from "./Spinner";

const TEXT = {
  loading: "Loading editor…",
  errorTitle: "VS Code not found",
  errorBody: "Install VS Code and restart the app.",
} as const;

const EDITOR_BASE_URL = "http://localhost:8080";
const LOADING_FONT_SIZE = 14;
const ERROR_TITLE_FONT_SIZE = 16;
const LOADING_BORDER_RADIUS = 4;
const LOADING_GAP = 12;
const ERROR_GAP = 8;
const LOADING_FONT_FAMILY = "monospace";
const LOADING_FADE_OUT_TRANSITION = "opacity 0.3s";

interface EditorProps {
  theme: "dark" | "light";
  scrollLocked: boolean;
}

export default function Editor({ theme, scrollLocked }: EditorProps): React.JSX.Element {
  const [serverReady, setServerReady] = useState(false);
  const [webviewLoaded, setWebviewLoaded] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const themeColors = colorsByTheme[theme];

  useEffect(() => {
    window.api.checkEditorError().then((hasError) => {
      if (hasError) {
        setEditorError(true);
        return;
      }
      window.api.onEditorError(() => setEditorError(true));
    });
    window.api.loadEditorUrl().then((url) => {
      setEditorUrl(url ?? EDITOR_BASE_URL);
    });
  }, []);

  useEffect(() => {
    if (editorError) return;
    window.api.checkEditorReady().then((isReady) => {
      if (isReady) {
        setServerReady(true);
      } else {
        window.api.onEditorReady(() => setServerReady(true));
      }
    });
  }, [editorError]);

  // Attach dom-ready listener once the webview is in the DOM.
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = (): void => {
      // The Electron webview shadow-root contains an <iframe> with no explicit height,
      // which prevents VS Code from filling the webview viewport. We patch it here.
      const innerIframe = webview.shadowRoot?.querySelector("iframe");
      if (innerIframe) {
        innerIframe.style.height = "100%";
      }

      // Wait for VS Code's workbench to finish initialising before revealing the editor.
      // VS Code sets document.title once the workbench is fully rendered (~500 ms after
      // dom-ready). Revealing only then prevents any flash of unstyled content.
      webview.executeJavaScript(`
        new Promise((resolve) => {
          const check = () => {
            if (document.title.length > 0) { resolve(); return; }
            setTimeout(check, 50);
          };
          check();
        })
      `).then(() => {
        setWebviewLoaded(true);
        webview.executeJavaScript("window.dispatchEvent(new Event('resize'))").catch(() => undefined);
      }).catch(() => {
        setWebviewLoaded(true);
      });
    };

    const handleDidNavigate = (event: { url: string }): void => {
      const { url } = event;
      if (url.startsWith(EDITOR_BASE_URL) && (url.includes("?folder=") || url.includes("?workspace="))) {
        window.api.saveEditorUrl(url).catch(() => undefined);
      }
    };

    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-navigate", handleDidNavigate);
    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-navigate", handleDidNavigate);
    };
  }, [serverReady, editorUrl]); // re-run when either flips so webview is guaranteed in the DOM

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    borderRadius: LOADING_BORDER_RADIUS,
    overflow: "hidden",
    pointerEvents: scrollLocked ? "none" : "auto",
  };

  const loadingStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: LOADING_GAP,
    fontSize: LOADING_FONT_SIZE,
    fontFamily: LOADING_FONT_FAMILY,
    background: themeColors.base,
    color: themeColors.text,
    userSelect: "none",
    opacity: webviewLoaded ? 0 : 1,
    // Only fade-out (opaque → transparent). Reappearance is instant so VS Code
    // is never visible during the transition back.
    transition: webviewLoaded ? LOADING_FADE_OUT_TRANSITION : "none",
    pointerEvents: "none",
  };

  const webviewStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "block",
    border: "none",
  };

  const errorStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: ERROR_GAP,
    fontFamily: LOADING_FONT_FAMILY,
    background: themeColors.base,
    userSelect: "none",
    pointerEvents: "none",
  };

  if (editorError) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>
          <span style={{ fontSize: ERROR_TITLE_FONT_SIZE, color: themeColors.red }}>{TEXT.errorTitle}</span>
          <span style={{ fontSize: LOADING_FONT_SIZE, color: themeColors.text }}>{TEXT.errorBody}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {serverReady && editorUrl !== null && (
        <webview
          ref={webviewRef}
          src={editorUrl}
          style={webviewStyle}
        />
      )}
      <div style={loadingStyle}>
        <Spinner color={themeColors.overlay0} />
        <span>{TEXT.loading}</span>
      </div>
    </div>
  );
}
