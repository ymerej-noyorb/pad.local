import { useEffect, useRef, useState } from "react";
import { IconWorld, IconBug, IconRefresh } from "@tabler/icons-react";
import { colorsByTheme } from "../theme";
import { patchWebviewIframeHeight } from "../lib/patchWebview";
import LoadingOverlay from "./LoadingOverlay";

const TOP_BAR_HEIGHT = 40;
const ICON_SIZE = 16;
const DEVTOOLS_ICON_SIZE = 14;
const INPUT_FONT_SIZE = 13;
const DIMENSION_INPUT_WIDTH = 56;
const BORDER_RADIUS = 4;
const TABLER_STROKE = 1.5;

const TEXT = {
  addressPlaceholder: "Enter URL (e.g. http://localhost:3000)",
  refresh: "Refresh",
  devtools: "DevTools",
  dimensionSeparator: "×"
} as const;

interface BrowserPanelProps {
  url: string;
  width: number;
  height: number;
  theme: "dark" | "light";
  scrollLocked: boolean;
  onResize: (width: number, height: number) => void;
  onUrlChange: (url: string) => void;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export default function BrowserPanel({
  url: initialUrl,
  width,
  height,
  theme,
  scrollLocked,
  onResize,
  onUrlChange
}: BrowserPanelProps): React.JSX.Element {
  const [src, setSrc] = useState(initialUrl);
  const [addressInput, setAddressInput] = useState(initialUrl);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [devtoolsHovered, setDevtoolsHovered] = useState(false);
  const [refreshHovered, setRefreshHovered] = useState(false);
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const onUrlChangeRef = useRef(onUrlChange);
  useEffect(() => {
    onUrlChangeRef.current = onUrlChange;
  }, [onUrlChange]);
  const themeColors = colorsByTheme[theme];

  const loaded = loadedSrc === src;

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !src) return;

    const handleDomReady = (): void => {
      patchWebviewIframeHeight(webview);
      setLoadedSrc(src);
    };

    const handleDidNavigate = (event: Electron.DidNavigateEvent): void => {
      setAddressInput(event.url);
      onUrlChangeRef.current(event.url);
    };

    const handleDidNavigateInPage = (event: Electron.DidNavigateInPageEvent): void => {
      if (!event.isMainFrame) return;
      setAddressInput(event.url);
      onUrlChangeRef.current(event.url);
    };

    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-navigate", handleDidNavigate);
    webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigateInPage);
    };
  }, [src]);

  function handleNavigate(): void {
    const normalized = normalizeUrl(addressInput);
    if (!normalized) return;
    setSrc(normalized);
    setAddressInput(normalized);
    onUrlChange(normalized);
  }

  function handleAddressKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") handleNavigate();
  }

  function commitWidth(rawValue: string): void {
    const value = Number(rawValue);
    if (value > 0) onResize(value, height);
  }

  function commitHeight(rawValue: string): void {
    const value = Number(rawValue);
    if (value > 0) onResize(width, value);
  }

  const topBarStyle: React.CSSProperties = {
    height: TOP_BAR_HEIGHT,
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0 0.5rem",
    background: themeColors.surface0,
    borderBottom: `1px solid ${themeColors.surface1}`,
    flexShrink: 0,
    overflow: "hidden"
  };

  const addressInputStyle: React.CSSProperties = {
    flex: 1,
    height: 26,
    padding: "0 0.5rem",
    background: themeColors.base,
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE,
    outline: "none",
    minWidth: 0,
    fontFamily: "inherit"
  };

  const dimInputStyle: React.CSSProperties = {
    width: DIMENSION_INPUT_WIDTH,
    height: 26,
    padding: "0 0.25rem",
    background: themeColors.base,
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE,
    outline: "none",
    textAlign: "center",
    fontFamily: "inherit",
    flexShrink: 0
  };

  const iconButtonStyle = (hovered: boolean): React.CSSProperties => ({
    height: 26,
    width: 26,
    padding: 0,
    background: hovered ? themeColors.surface1 : "transparent",
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  });

  const devtoolsButtonStyle: React.CSSProperties = {
    height: 26,
    padding: "0 0.4rem",
    background: devtoolsHovered ? themeColors.surface1 : "transparent",
    border: `1px solid ${themeColors.surface1}`,
    borderRadius: BORDER_RADIUS,
    color: themeColors.text,
    fontSize: INPUT_FONT_SIZE - 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    flexShrink: 0,
    whiteSpace: "nowrap",
    fontFamily: "inherit"
  };

  const separatorStyle: React.CSSProperties = {
    color: themeColors.overlay0,
    fontSize: INPUT_FONT_SIZE,
    flexShrink: 0,
    userSelect: "none"
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    background: themeColors.base
  };

  const webviewContainerStyle: React.CSSProperties = {
    flex: 1,
    position: "relative",
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
      <div style={topBarStyle}>
        <IconWorld size={ICON_SIZE} stroke={TABLER_STROKE} color={themeColors.overlay0} />
        <button
          style={iconButtonStyle(refreshHovered)}
          onClick={() => webviewRef.current?.reload()}
          onMouseEnter={() => setRefreshHovered(true)}
          onMouseLeave={() => setRefreshHovered(false)}
          title={TEXT.refresh}
        >
          <IconRefresh size={ICON_SIZE} stroke={TABLER_STROKE} />
        </button>
        <input
          type="text"
          value={addressInput}
          onChange={(event) => setAddressInput(event.target.value)}
          onKeyDown={handleAddressKeyDown}
          placeholder={TEXT.addressPlaceholder}
          style={addressInputStyle}
        />
        <input
          key={"w" + width}
          type="number"
          defaultValue={Math.round(width)}
          onBlur={(event) => commitWidth(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitWidth(event.currentTarget.value);
          }}
          style={dimInputStyle}
        />
        <span style={separatorStyle}>{TEXT.dimensionSeparator}</span>
        <input
          key={"h" + height}
          type="number"
          defaultValue={Math.round(height)}
          onBlur={(event) => commitHeight(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitHeight(event.currentTarget.value);
          }}
          style={dimInputStyle}
        />
        <button
          style={devtoolsButtonStyle}
          onClick={() => webviewRef.current?.openDevTools()}
          onMouseEnter={() => setDevtoolsHovered(true)}
          onMouseLeave={() => setDevtoolsHovered(false)}
          title={TEXT.devtools}
        >
          <IconBug size={DEVTOOLS_ICON_SIZE} stroke={TABLER_STROKE} />
          {TEXT.devtools}
        </button>
      </div>
      <div style={webviewContainerStyle}>
        {src && (
          <webview ref={webviewRef} src={src} partition="persist:browser" style={webviewStyle} />
        )}
        {src && (
          <LoadingOverlay
            icon={<IconWorld size={48} stroke={TABLER_STROKE} color={themeColors.overlay0} />}
            color={themeColors.overlay0}
            background={themeColors.base}
            loaded={loaded}
          />
        )}
      </div>
    </div>
  );
}
