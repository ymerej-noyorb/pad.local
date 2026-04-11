import { useEffect, useRef, useState } from "react";
import { colorsByTheme } from "../theme";

const TEXT = {
  loading: "Loading editor…",
} as const;

const EDITOR_URL = "http://localhost:8080";
const LOADING_FONT_SIZE = 14;
const LOADING_BORDER_RADIUS = 4;
const LOADING_TRANSITION = "opacity 0.3s";

interface EditorProps {
  theme: "dark" | "light";
  scrollLocked: boolean;
}

export default function Editor({ theme, scrollLocked }: EditorProps): React.JSX.Element {
  const [serverReady, setServerReady] = useState(false);
  const [webviewLoaded, setWebviewLoaded] = useState(false);
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const themeColors = colorsByTheme[theme];

  useEffect(() => {
    window.api.checkEditorReady().then((isReady) => {
      if (isReady) {
        setServerReady(true);
      } else {
        window.api.onEditorReady(() => setServerReady(true));
      }
    });
  }, []);

  // Attach dom-ready listener once the webview is in the DOM.
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = (): void => {
      setWebviewLoaded(true);

      // The Electron webview shadow-root contains an <iframe> with no explicit height,
      // which prevents VS Code from filling the webview viewport. We patch it here.
      const innerIframe = webview.shadowRoot?.querySelector("iframe");
      if (innerIframe) {
        innerIframe.style.height = "100%";
      }

      // Trigger VS Code to re-measure its layout after the iframe is resized.
      webview.executeJavaScript("window.dispatchEvent(new Event('resize'))").catch(() => undefined);
    };

    webview.addEventListener("dom-ready", handleDomReady);
    return () => { webview.removeEventListener("dom-ready", handleDomReady); };
  }, [serverReady]); // re-run when serverReady flips so webview is in the DOM

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
    alignItems: "center",
    justifyContent: "center",
    fontSize: LOADING_FONT_SIZE,
    fontFamily: "monospace",
    background: themeColors.base,
    color: themeColors.text,
    userSelect: "none",
    opacity: webviewLoaded ? 0 : 1,
    transition: LOADING_TRANSITION,
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

  return (
    <div style={containerStyle}>
      <div style={loadingStyle}>{TEXT.loading}</div>
      {serverReady && (
        <webview
          ref={webviewRef}
          src={EDITOR_URL}
          style={webviewStyle}
        />
      )}
    </div>
  );
}
