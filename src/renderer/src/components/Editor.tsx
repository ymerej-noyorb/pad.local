import { useEffect, useRef, useState } from "react";
import { colorsByTheme } from "../theme";
import Spinner from "./Spinner";
import type { EditorType } from "../../../shared/types";

const LOADING_FONT_SIZE = 14;
const ERROR_TITLE_FONT_SIZE = 16;
const LOADING_BORDER_RADIUS = 4;
const LOADING_GAP = 12;
const ERROR_GAP = 8;
const LOADING_FONT_FAMILY = "monospace";
const LOADING_FADE_OUT_TRANSITION = "opacity 0.3s";

const TEXT = {
  labels: {
    vscode: "VS Code",
    cursor: "Cursor",
    windsurf: "Windsurf",
    vscodium: "VSCodium"
  } satisfies Record<EditorType, string>,
  loading: "Loading editor…",
  errorNotFound: (label: string) => `${label} not found`,
  errorInstall: (label: string) => `Install ${label} and restart the app.`
} as const;

interface EditorProps {
  editorType: EditorType;
  theme: "dark" | "light";
  scrollLocked: boolean;
}

export default function Editor({
  editorType,
  theme,
  scrollLocked
}: EditorProps): React.JSX.Element {
  const [serverReady, setServerReady] = useState(false);
  const [webviewLoaded, setWebviewLoaded] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const themeColors = colorsByTheme[theme];
  const label = TEXT.labels[editorType];

  useEffect(() => {
    window.api.startEditor(editorType);

    const unsubscribeError = window.api.onEditorError((type) => {
      if (type === editorType) setEditorError(true);
    });

    const unsubscribeReady = window.api.onEditorReady((type) => {
      if (type === editorType) setServerReady(true);
    });

    window.api.checkEditorError(editorType).then((hasError) => {
      if (hasError) setEditorError(true);
    });

    window.api.checkEditorReady(editorType).then((isReady) => {
      if (isReady) setServerReady(true);
    });

    window.api.getEditorPort(editorType).then((port) => {
      window.api.loadEditorUrl(editorType).then((savedUrl) => {
        setEditorUrl(savedUrl ?? `http://localhost:${port}`);
      });
    });

    return () => {
      unsubscribeError();
      unsubscribeReady();
    };
  }, [editorType]);

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
      webview
        .executeJavaScript(
          `
        new Promise((resolve) => {
          const check = () => {
            if (document.title.length > 0) { resolve(); return; }
            setTimeout(check, 50);
          };
          check();
        })
      `
        )
        .then(() => {
          setWebviewLoaded(true);
          webview
            .executeJavaScript("window.dispatchEvent(new Event('resize'))")
            .catch(() => undefined);
        })
        .catch(() => {
          setWebviewLoaded(true);
        });
    };

    const handleDidNavigate = (event: { url: string }): void => {
      const { url } = event;
      window.api.getEditorPort(editorType).then((port) => {
        const baseUrl = `http://localhost:${port}`;
        if (url.startsWith(baseUrl) && (url.includes("?folder=") || url.includes("?workspace="))) {
          window.api.saveEditorUrl(editorType, url).catch(() => undefined);
        }
      });
    };

    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-navigate", handleDidNavigate);
    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-navigate", handleDidNavigate);
    };
  }, [serverReady, editorUrl, editorType]);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    borderRadius: LOADING_BORDER_RADIUS,
    overflow: "hidden",
    pointerEvents: scrollLocked ? "none" : "auto"
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
    pointerEvents: "none"
  };

  const webviewStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "block",
    border: "none"
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
    pointerEvents: "none"
  };

  if (editorError) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>
          <span style={{ fontSize: ERROR_TITLE_FONT_SIZE, color: themeColors.red }}>
            {TEXT.errorNotFound(label)}
          </span>
          <span style={{ fontSize: LOADING_FONT_SIZE, color: themeColors.text }}>
            {TEXT.errorInstall(label)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {serverReady && editorUrl !== null && (
        <webview ref={webviewRef} src={editorUrl} style={webviewStyle} />
      )}
      <div style={loadingStyle}>
        <Spinner color={themeColors.overlay0} />
        <span>{TEXT.loading}</span>
      </div>
    </div>
  );
}
