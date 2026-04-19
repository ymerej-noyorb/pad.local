import { useEffect, useRef, useState } from "react";
import { colorsByTheme } from "../theme";
import Spinner from "./Spinner";
import type { AiProvider } from "../../../shared/types";

const LOADING_FONT_SIZE = 14;
const LOADING_BORDER_RADIUS = 4;
const LOADING_GAP = 12;
const LOADING_FONT_FAMILY = "monospace";
const LOADING_FADE_OUT_TRANSITION = "opacity 0.3s";

const TEXT = {
  loading: "Loading…"
} as const;

interface AiPanelProps {
  providerId: AiProvider;
  url: string;
  theme: "dark" | "light";
  scrollLocked: boolean;
}

export default function AiPanel({
  providerId,
  url,
  theme,
  scrollLocked
}: AiPanelProps): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const themeColors = colorsByTheme[theme];

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = (): void => {
      const innerIframe = webview.shadowRoot?.querySelector("iframe");
      if (innerIframe) {
        innerIframe.style.height = "100%";
      }
      setLoaded(true);
    };

    webview.addEventListener("dom-ready", handleDomReady);
    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
    };
  }, []);

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
    opacity: loaded ? 0 : 1,
    transition: loaded ? LOADING_FADE_OUT_TRANSITION : "none",
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

  return (
    <div style={containerStyle}>
      <webview
        ref={webviewRef}
        src={url}
        partition={`persist:ai-${providerId}`}
        style={webviewStyle}
      />
      <div style={loadingStyle}>
        <Spinner color={themeColors.overlay0} />
        <span>{TEXT.loading}</span>
      </div>
    </div>
  );
}
