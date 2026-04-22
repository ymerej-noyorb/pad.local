import { useEffect, useRef, useState } from "react";
import { IconBrandOpenai, IconBrandGithubCopilot } from "@tabler/icons-react";
import { colorsByTheme } from "../theme";
import { patchWebviewIframeHeight } from "../lib/patchWebview";
import Icon from "./Icon";
import LoadingOverlay from "./LoadingOverlay";
import type { AiProvider } from "../../../shared/types";

const LOADING_BORDER_RADIUS = 4;
const LOADING_ICON_SIZE = 48;
const TABLER_STROKE = 1.5;

function getProviderIcon(providerId: AiProvider): React.JSX.Element {
  switch (providerId) {
    case "claude":
      return <Icon name="claude" size={LOADING_ICON_SIZE} />;
    case "chatgpt":
      return <IconBrandOpenai size={LOADING_ICON_SIZE} stroke={TABLER_STROKE} />;
    case "gemini":
      return <Icon name="gemini" size={LOADING_ICON_SIZE} />;
    case "copilot":
      return <IconBrandGithubCopilot size={LOADING_ICON_SIZE} stroke={TABLER_STROKE} />;
    case "perplexity":
      return <Icon name="perplexity" size={LOADING_ICON_SIZE} />;
    case "mistral":
      return <Icon name="mistral" size={LOADING_ICON_SIZE} />;
  }
}

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
      patchWebviewIframeHeight(webview);
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
      <LoadingOverlay
        icon={getProviderIcon(providerId)}
        color={themeColors.overlay0}
        background={themeColors.base}
        loaded={loaded}
      />
    </div>
  );
}
